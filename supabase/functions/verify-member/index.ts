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
    
    // Validate required fields exist (offerId is now optional for birthday-only checks)
    if (!memberId || !businessId) {
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

    // Only validate offerId if provided
    if (offerId && !isValidUUID(offerId)) {
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
      .select('id, pet_name, pet_type')
      .eq('membership_id', membership.id);
    
    const petNames = pets && pets.length > 0 
      ? pets.map(p => p.pet_name).join(', ') 
      : (membership.pet_name || 'Not specified');

    // Check for pending birthday offers for this member from THIS business only
    const { data: pendingBirthdayOffers } = await supabaseAdmin
      .from('sent_birthday_offers')
      .select('id, pet_name, discount_value, discount_type, message, business_id, sent_at')
      .eq('owner_user_id', membership.user_id)
      .eq('business_id', businessId)
      .is('redeemed_at', null);

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
          pendingBirthdayOffers: pendingBirthdayOffers || [],
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get profile for member name
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('full_name')
      .eq('user_id', membership.user_id)
      .maybeSingle();

    // If no offerId provided, return member info with birthday offers only (birthday-only verification)
    if (!offerId) {
      return new Response(
        JSON.stringify({
          status: 'valid',
          memberName: profile?.full_name || 'Member',
          petName: petNames,
          memberId: membership.member_number,
          membershipId: membership.id,
          expiryDate: new Date(membership.expires_at).toLocaleDateString(),
          pendingBirthdayOffers: pendingBirthdayOffers || [],
          availablePets: (pets || []).map(p => ({ id: p.id, name: p.pet_name })),
          totalPets: (pets || []).length,
          // No offer-specific fields since no offer was selected
          offerId: null,
          offerTitle: null,
          discount: null,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get offer details including redemption rules and pet_type
    const { data: offer } = await supabaseAdmin
      .from('offers')
      .select('id, title, discount_value, discount_type, max_redemptions, offer_type, redemption_scope, redemption_frequency, pet_type')
      .eq('id', offerId)
      .single();

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

    // Use new redemption_scope field, fallback to offer_type for backward compatibility
    const redemptionScope = offer?.redemption_scope || offer?.offer_type || 'per_member';
    const redemptionFrequency = offer?.redemption_frequency || 'one_time';

    // Helper function to get the date filter based on frequency
    const getFrequencyDateFilter = (frequency: string): Date | null => {
      const now = new Date();
      switch (frequency) {
        case 'daily':
          return new Date(now.getFullYear(), now.getMonth(), now.getDate());
        case 'weekly':
          const dayOfWeek = now.getDay();
          const monday = new Date(now);
          monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
          monday.setHours(0, 0, 0, 0);
          return monday;
        case 'monthly':
          return new Date(now.getFullYear(), now.getMonth(), 1);
        case 'unlimited':
          return null; // No date filter - always allow
        case 'one_time':
        default:
          return new Date(0); // Check all time
      }
    };

    const frequencyDateFilter = getFrequencyDateFilter(redemptionFrequency);
    
    if (redemptionScope === 'per_pet') {
      // Filter pets by offer's pet_type if specified
      const eligiblePets = offer?.pet_type 
        ? (pets || []).filter(pet => pet.pet_type === offer.pet_type)
        : (pets || []);

      // If no eligible pets for this offer type
      if (eligiblePets.length === 0) {
        const petTypeLabel = offer?.pet_type === 'dog' ? 'dogs' : offer?.pet_type === 'cat' ? 'cats' : 'pets';
        return new Response(
          JSON.stringify({
            status: 'already_redeemed',
            memberName: profile?.full_name || 'Member',
            petName: petNames,
            memberId: membership.member_number,
            expiryDate: new Date(membership.expires_at).toLocaleDateString(),
            offerTitle: offer?.title,
            message: `This offer is only for ${petTypeLabel}. You don't have any registered ${petTypeLabel}.`,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // For per-pet offers, check which pets have already redeemed within the frequency period
      let redemptionQuery = supabaseAdmin
        .from('offer_redemptions')
        .select('pet_id, redeemed_at')
        .eq('membership_id', membership.id)
        .eq('offer_id', offerId);
      
      // Apply date filter if not unlimited
      if (frequencyDateFilter !== null) {
        redemptionQuery = redemptionQuery.gte('redeemed_at', frequencyDateFilter.toISOString());
      }

      const { data: existingRedemptions } = await redemptionQuery;

      // If unlimited frequency, all eligible pets are always available
      if (redemptionFrequency === 'unlimited') {
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
            offerPetType: offer?.pet_type || null,
            redemptionFrequency: redemptionFrequency,
            availablePets: eligiblePets.map(p => ({ id: p.id, name: p.pet_name })),
            totalPets: eligiblePets.length,
            redeemedPetsCount: 0,
            pendingBirthdayOffers: pendingBirthdayOffers || [],
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const redeemedPetIds = new Set((existingRedemptions || []).map(r => r.pet_id));
      const availablePets = eligiblePets.filter(pet => !redeemedPetIds.has(pet.id));

      if (availablePets.length === 0) {
        const petTypeLabel = offer?.pet_type === 'dog' ? 'dogs' : offer?.pet_type === 'cat' ? 'cats' : 'pets';
        const frequencyMessage = redemptionFrequency === 'one_time' 
          ? `All eligible ${petTypeLabel} have already used this offer.`
          : `All eligible ${petTypeLabel} have already used this offer this ${redemptionFrequency === 'daily' ? 'day' : redemptionFrequency === 'weekly' ? 'week' : 'month'}.`;
        
        return new Response(
          JSON.stringify({
            status: 'already_redeemed',
            memberName: profile?.full_name || 'Member',
            petName: petNames,
            memberId: membership.member_number,
            expiryDate: new Date(membership.expires_at).toLocaleDateString(),
            offerTitle: offer?.title,
            message: frequencyMessage,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Valid - return available pets for selection (filtered by pet_type)
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
          offerPetType: offer?.pet_type || null,
          redemptionFrequency: redemptionFrequency,
          availablePets: availablePets.map(p => ({ id: p.id, name: p.pet_name })),
          totalPets: eligiblePets.length,
          redeemedPetsCount: redeemedPetIds.size,
          pendingBirthdayOffers: pendingBirthdayOffers || [],
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Per-member: check if already redeemed within the frequency period
      
      // Get all pets for optional selection (for data tracking)
      const allPets = pets || [];
      
      // If unlimited frequency, always allow
      if (redemptionFrequency === 'unlimited') {
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
            redemptionFrequency: redemptionFrequency,
            availablePets: allPets.map(p => ({ id: p.id, name: p.pet_name })),
            totalPets: allPets.length,
            pendingBirthdayOffers: pendingBirthdayOffers || [],
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      let redemptionQuery = supabaseAdmin
        .from('offer_redemptions')
        .select('id, redeemed_at')
        .eq('membership_id', membership.id)
        .eq('offer_id', offerId);
      
      // Apply date filter
      if (frequencyDateFilter !== null) {
        redemptionQuery = redemptionQuery.gte('redeemed_at', frequencyDateFilter.toISOString());
      }

      const { data: existingRedemption } = await redemptionQuery.maybeSingle();

      if (existingRedemption) {
        const frequencyMessage = redemptionFrequency === 'one_time' 
          ? 'You have already used this offer.'
          : `You have already used this offer this ${redemptionFrequency === 'daily' ? 'day' : redemptionFrequency === 'weekly' ? 'week' : 'month'}.`;
        
        return new Response(
          JSON.stringify({
            status: 'already_redeemed',
            memberName: profile?.full_name || 'Member',
            petName: petNames,
            memberId: membership.member_number,
            expiryDate: new Date(membership.expires_at).toLocaleDateString(),
            offerTitle: offer?.title,
            message: frequencyMessage,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Valid membership for per-member offer - include pets for optional tracking
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
          redemptionFrequency: redemptionFrequency,
          availablePets: allPets.map(p => ({ id: p.id, name: p.pet_name })),
          totalPets: allPets.length,
          pendingBirthdayOffers: pendingBirthdayOffers || [],
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