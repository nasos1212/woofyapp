import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting configuration
const MAX_FAILED_ATTEMPTS = 10; // Max failed attempts per window
const RATE_LIMIT_WINDOW_MINUTES = 15; // Time window in minutes
const LOCKOUT_DURATION_MINUTES = 30; // Lockout duration after exceeding limit

serve(async (req) => {
  console.log('=== verify-member function called ===');
  console.log('Method:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    console.log('Supabase URL:', supabaseUrl ? 'set' : 'not set');
    console.log('Service key:', supabaseServiceKey ? 'set' : 'not set');
    
    // Create service role client for rate limit operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get user's auth from request
    const authHeader = req.headers.get('Authorization');
    console.log('Auth header present:', !!authHeader);
    
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header', code: 'UNAUTHORIZED' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAnon = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseClient = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized', code: 'UNAUTHORIZED' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('User authenticated:', user.id);

    const { memberId, offerId, businessId } = await req.json();
    console.log('Request body - memberId:', memberId, 'offerId:', offerId, 'businessId:', businessId);
    
    if (!memberId || !offerId || !businessId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields', code: 'MISSING_FIELDS' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get IP address for additional rate limiting
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                      req.headers.get('cf-connecting-ip') || 
                      'unknown';

    console.log(`Verification attempt: business=${businessId}, member=${memberId}, ip=${ipAddress}`);

    // Check if business is currently locked out
    const lockoutWindow = new Date();
    lockoutWindow.setMinutes(lockoutWindow.getMinutes() - LOCKOUT_DURATION_MINUTES);

    const { data: recentFailures, error: failuresError } = await supabaseAdmin
      .from('verification_attempts')
      .select('id')
      .eq('business_id', businessId)
      .eq('success', false)
      .gte('created_at', lockoutWindow.toISOString());

    if (failuresError) {
      console.error('Error checking rate limits:', failuresError);
    }

    const failedCount = recentFailures?.length || 0;

    if (failedCount >= MAX_FAILED_ATTEMPTS) {
      console.warn(`Rate limit exceeded for business ${businessId}: ${failedCount} failed attempts`);
      
      // Calculate when lockout expires
      const { data: oldestFailure } = await supabaseAdmin
        .from('verification_attempts')
        .select('created_at')
        .eq('business_id', businessId)
        .eq('success', false)
        .gte('created_at', lockoutWindow.toISOString())
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      const lockoutExpires = oldestFailure 
        ? new Date(new Date(oldestFailure.created_at).getTime() + LOCKOUT_DURATION_MINUTES * 60 * 1000)
        : new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000);

      return new Response(
        JSON.stringify({ 
          error: 'Too many failed verification attempts. Please try again later.',
          code: 'RATE_LIMITED',
          lockoutExpiresAt: lockoutExpires.toISOString(),
          remainingMinutes: Math.ceil((lockoutExpires.getTime() - Date.now()) / 60000)
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Proceed with verification - use admin client since business users can't see other members' data
    console.log('Looking up membership with member_number:', memberId.trim());
    
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('memberships')
      .select('id, user_id, member_number, pet_name, pet_breed, expires_at, is_active')
      .eq('member_number', memberId.trim())
      .maybeSingle();

    console.log('Membership lookup result:', { membership, error: membershipError });

    // Record the attempt
    const success = !membershipError && membership && 
                   new Date(membership.expires_at) >= new Date() && 
                   membership.is_active;

    console.log('Recording attempt, success:', success);
    
    const { error: insertError } = await supabaseAdmin
      .from('verification_attempts')
      .insert({
        business_id: businessId,
        attempted_member_id: memberId,
        success: success,
        ip_address: ipAddress
      });
    
    if (insertError) {
      console.error('Failed to record attempt:', insertError);
    }

    if (membershipError || !membership) {
      console.log(`Invalid member ID: ${memberId}, error:`, membershipError);
      return new Response(
        JSON.stringify({ 
          status: 'invalid',
          attemptsRemaining: MAX_FAILED_ATTEMPTS - failedCount - 1
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if membership is expired
    if (new Date(membership.expires_at) < new Date() || !membership.is_active) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('full_name')
        .eq('user_id', membership.user_id)
        .maybeSingle();

      return new Response(
        JSON.stringify({
          status: 'expired',
          memberName: profile?.full_name || 'Unknown',
          petName: membership.pet_name || 'Not specified',
          memberId: membership.member_number,
          expiryDate: new Date(membership.expires_at).toLocaleDateString(),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if offer has already been redeemed - use admin to check cross-user data
    const { data: existingRedemption } = await supabaseAdmin
      .from('offer_redemptions')
      .select('id')
      .eq('membership_id', membership.id)
      .eq('offer_id', offerId)
      .maybeSingle();

    // Get offer details
    const { data: offer } = await supabaseAdmin
      .from('offers')
      .select('id, title, discount_value, discount_type')
      .eq('id', offerId)
      .single();

    // Get profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('full_name')
      .eq('user_id', membership.user_id)
      .maybeSingle();

    if (existingRedemption) {
      return new Response(
        JSON.stringify({
          status: 'already_redeemed',
          memberName: profile?.full_name || 'Unknown',
          petName: membership.pet_name || 'Not specified',
          memberId: membership.member_number,
          expiryDate: new Date(membership.expires_at).toLocaleDateString(),
          offerTitle: offer?.title,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Valid membership
    console.log(`Successful verification: member=${memberId}`);
    return new Response(
      JSON.stringify({
        status: 'valid',
        memberName: profile?.full_name || 'Unknown',
        petName: membership.pet_name || 'Not specified',
        memberId: membership.member_number,
        membershipId: membership.id,
        expiryDate: new Date(membership.expires_at).toLocaleDateString(),
        discount: offer ? `${offer.discount_value}${offer.discount_type === 'percentage' ? '%' : '€'} - ${offer.title}` : '',
        offerId: offerId,
        offerTitle: offer?.title,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in verify-member function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', code: 'INTERNAL_ERROR' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
