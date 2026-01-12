import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting configuration
const MAX_FAILED_ATTEMPTS = 10;
const RATE_LIMIT_WINDOW_MINUTES = 15;
const LOCKOUT_DURATION_MINUTES = 30;

// Input validation helpers
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MEMBER_ID_MAX_LENGTH = 50;

const isValidUUID = (str: string): boolean => UUID_REGEX.test(str);
const isValidMemberId = (str: string): boolean => 
  typeof str === 'string' && str.length > 0 && str.length <= MEMBER_ID_MAX_LENGTH;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse and validate request body
    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid request format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { memberId, offerId, businessId } = body;
    
    // Validate required fields exist
    if (!memberId || !offerId || !businessId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate input formats
    if (!isValidMemberId(memberId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid member ID format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!isValidUUID(offerId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid offer ID format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!isValidUUID(businessId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid business ID format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const sanitizedMemberId = memberId.trim();

    // Get IP address for rate limiting
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                      req.headers.get('cf-connecting-ip') || 
                      'unknown';

    // Check rate limiting
    const lockoutWindow = new Date();
    lockoutWindow.setMinutes(lockoutWindow.getMinutes() - LOCKOUT_DURATION_MINUTES);

    const { data: recentFailures } = await supabaseAdmin
      .from('verification_attempts')
      .select('id')
      .eq('business_id', businessId)
      .eq('success', false)
      .gte('created_at', lockoutWindow.toISOString());

    const failedCount = recentFailures?.length || 0;

    if (failedCount >= MAX_FAILED_ATTEMPTS) {
      return new Response(
        JSON.stringify({ 
          error: 'Too many failed attempts. Please try again later.',
          status: 'rate_limited'
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Lookup membership
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('memberships')
      .select('id, user_id, member_number, pet_name, pet_breed, expires_at, is_active')
      .eq('member_number', sanitizedMemberId)
      .maybeSingle();

    // Determine success status
    const success = !membershipError && membership && 
                   new Date(membership.expires_at) >= new Date() && 
                   membership.is_active;

    // Record the attempt (fail silently if this fails)
    await supabaseAdmin
      .from('verification_attempts')
      .insert({
        business_id: businessId,
        attempted_member_id: sanitizedMemberId,
        success: success,
        ip_address: ipAddress
      });

    if (membershipError || !membership) {
      return new Response(
        JSON.stringify({ 
          status: 'invalid'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch pets for this membership
    const { data: pets } = await supabaseAdmin
      .from('pets')
      .select('id, pet_name')
      .eq('membership_id', membership.id);
    
    const petNames = pets && pets.length > 0 
      ? pets.map(p => p.pet_name).join(', ') 
      : (membership.pet_name || 'Not specified');

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
          memberName: profile?.full_name || 'Member',
          petName: petNames,
          memberId: membership.member_number,
          expiryDate: new Date(membership.expires_at).toLocaleDateString(),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get offer details including offer_type
    const { data: offer } = await supabaseAdmin
      .from('offers')
      .select('id, title, discount_value, discount_type, max_redemptions, offer_type')
      .eq('id', offerId)
      .single();

    // Get profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('full_name')
      .eq('user_id', membership.user_id)
      .maybeSingle();

    // Check if offer has reached max redemptions
    if (offer?.max_redemptions !== null && offer?.max_redemptions !== undefined) {
      const { count: redemptionCount } = await supabaseAdmin
        .from('offer_redemptions')
        .select('id', { count: 'exact', head: true })
        .eq('offer_id', offerId);

      if (redemptionCount !== null && redemptionCount >= offer.max_redemptions) {
        return new Response(
          JSON.stringify({
            status: 'limit_reached',
            memberName: profile?.full_name || 'Member',
            petName: petNames,
            memberId: membership.member_number,
            offerTitle: offer?.title,
            message: 'This offer has reached its maximum redemption limit.',
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Handle per-pet vs per-member redemption logic
    const offerType = offer?.offer_type || 'per_member';
    
    if (offerType === 'per_pet') {
      // For per-pet offers, check which pets have already redeemed
      const { data: existingRedemptions } = await supabaseAdmin
        .from('offer_redemptions')
        .select('pet_id')
        .eq('membership_id', membership.id)
        .eq('offer_id', offerId);

      const redeemedPetIds = new Set((existingRedemptions || []).map(r => r.pet_id));
      const availablePets = (pets || []).filter(pet => !redeemedPetIds.has(pet.id));

      if (availablePets.length === 0) {
        return new Response(
          JSON.stringify({
            status: 'already_redeemed',
            memberName: profile?.full_name || 'Member',
            petName: petNames,
            memberId: membership.member_number,
            expiryDate: new Date(membership.expires_at).toLocaleDateString(),
            offerTitle: offer?.title,
            message: 'All pets have already used this offer.',
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Valid - return available pets for selection
      return new Response(
        JSON.stringify({
          status: 'valid',
          memberName: profile?.full_name || 'Member',
          petName: petNames,
          memberId: membership.member_number,
          membershipId: membership.id,
          expiryDate: new Date(membership.expires_at).toLocaleDateString(),
          discount: offer ? `${offer.discount_value}${offer.discount_type === 'percentage' ? '%' : '€'} - ${offer.title}` : '',
          offerId: offerId,
          offerTitle: offer?.title,
          offerType: 'per_pet',
          availablePets: availablePets.map(p => ({ id: p.id, name: p.pet_name })),
          totalPets: pets?.length || 0,
          redeemedPetsCount: redeemedPetIds.size,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Per-member: check if already redeemed (original logic)
      const { data: existingRedemption } = await supabaseAdmin
        .from('offer_redemptions')
        .select('id')
        .eq('membership_id', membership.id)
        .eq('offer_id', offerId)
        .maybeSingle();

      if (existingRedemption) {
        return new Response(
          JSON.stringify({
            status: 'already_redeemed',
            memberName: profile?.full_name || 'Member',
            petName: petNames,
            memberId: membership.member_number,
            expiryDate: new Date(membership.expires_at).toLocaleDateString(),
            offerTitle: offer?.title,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Valid membership for per-member offer
      return new Response(
        JSON.stringify({
          status: 'valid',
          memberName: profile?.full_name || 'Member',
          petName: petNames,
          memberId: membership.member_number,
          membershipId: membership.id,
          expiryDate: new Date(membership.expires_at).toLocaleDateString(),
          discount: offer ? `${offer.discount_value}${offer.discount_type === 'percentage' ? '%' : '€'} - ${offer.title}` : '',
          offerId: offerId,
          offerTitle: offer?.title,
          offerType: 'per_member',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('verify-member error:', error instanceof Error ? error.message : 'Unknown error');
    return new Response(
      JSON.stringify({ error: 'An error occurred. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});