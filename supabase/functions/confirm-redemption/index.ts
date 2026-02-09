import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation helpers
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isValidUUID = (str: string): boolean => UUID_REGEX.test(str);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnon = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
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

    const { membershipId, offerId, businessId, petId } = body;
    
    // Validate required fields exist
    if (!membershipId || !offerId || !businessId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate UUID formats
    if (!isValidUUID(membershipId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid membership ID format' }),
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

    // Validate petId if provided
    if (petId && !isValidUUID(petId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid pet ID format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the business belongs to the current user
    const { data: business } = await supabaseClient
      .from('businesses')
      .select('id, business_name')
      .eq('id', businessId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!business) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get membership details
    const { data: membership } = await supabaseAdmin
      .from('memberships')
      .select('id, user_id, member_number, pet_name')
      .eq('id', membershipId)
      .single();

    if (!membership) {
      return new Response(
        JSON.stringify({ error: 'Invalid request' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch pets for this membership (include pet_type for validation)
    const { data: petsData } = await supabaseAdmin
      .from('pets')
      .select('id, pet_name, pet_type')
      .eq('membership_id', membershipId);
    
    const petNames = petsData && petsData.length > 0 
      ? petsData.map(p => p.pet_name).join(', ') 
      : (membership.pet_name || 'Not specified');

    // Fetch profile for member name
    const { data: profileData } = await supabaseAdmin
      .from('profiles')
      .select('full_name, email')
      .eq('user_id', membership.user_id)
      .maybeSingle();
    
    const memberName = profileData?.full_name || 'Member';

    // Get offer details including redemption rules and pet_type
    const { data: offer } = await supabaseAdmin
      .from('offers')
      .select('id, title, discount_value, discount_type, business_id, offer_type, redemption_scope, redemption_frequency, pet_type')
      .eq('id', offerId)
      .single();

    if (!offer) {
      return new Response(
        JSON.stringify({ error: 'Invalid request' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use new redemption_scope field, fallback to offer_type for backward compatibility
    const redemptionScope = offer.redemption_scope || offer.offer_type || 'per_member';
    const redemptionFrequency = offer.redemption_frequency || 'one_time';

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

    // Check redemption based on offer type
    if (redemptionScope === 'per_pet') {
      // For per-pet offers, petId is required
      if (!petId) {
        return new Response(
          JSON.stringify({ error: 'Pet selection required for this offer', code: 'PET_REQUIRED' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate that the selected pet matches the offer's pet_type
      const selectedPet = petsData?.find(p => p.id === petId);
      if (!selectedPet) {
        return new Response(
          JSON.stringify({ error: 'Selected pet not found', code: 'PET_NOT_FOUND' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if the pet's type matches the offer's pet_type restriction
      if (offer.pet_type && selectedPet.pet_type !== offer.pet_type) {
        const petTypeLabel = offer.pet_type === 'dog' ? 'dogs' : 'cats';
        return new Response(
          JSON.stringify({ 
            error: `This offer is only valid for ${petTypeLabel}`, 
            code: 'PET_TYPE_MISMATCH' 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if this specific pet already redeemed within the frequency period (unless unlimited)
      if (redemptionFrequency !== 'unlimited') {
        let redemptionQuery = supabaseAdmin
          .from('offer_redemptions')
          .select('id')
          .eq('membership_id', membershipId)
          .eq('offer_id', offerId)
          .eq('pet_id', petId);
        
        if (frequencyDateFilter !== null) {
          redemptionQuery = redemptionQuery.gte('redeemed_at', frequencyDateFilter.toISOString());
        }

        const { data: existingRedemption } = await redemptionQuery.maybeSingle();

        if (existingRedemption) {
          const frequencyMessage = redemptionFrequency === 'one_time' 
            ? 'This pet has already used this offer'
            : `This pet has already used this offer this ${redemptionFrequency === 'daily' ? 'day' : redemptionFrequency === 'weekly' ? 'week' : 'month'}`;
          
          return new Response(
            JSON.stringify({ error: frequencyMessage, code: 'ALREADY_REDEEMED' }),
            { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // Get pet name for the notification
      const petNameForNotification = selectedPet.pet_name || 'Your pet';

      // Insert the redemption with pet_id
      const { data: redemption, error: redemptionError } = await supabaseAdmin
        .from('offer_redemptions')
        .insert({
          membership_id: membershipId,
          offer_id: offerId,
          business_id: businessId,
          redeemed_by_user_id: user.id,
          member_name: memberName,
          pet_names: petNameForNotification,
          member_number: membership.member_number,
          pet_id: petId,
        })
        .select()
        .single();

      if (redemptionError) {
        console.error('Redemption error:', redemptionError.message);
        return new Response(
          JSON.stringify({ error: 'Failed to process redemption. Please try again.' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create notification for the member
      const discountText = offer.discount_type === 'percentage' 
        ? `${offer.discount_value}%` 
        : `€${offer.discount_value}`;

      await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: membership.user_id,
          type: 'redemption',
          title: 'Offer Redeemed! 🎉',
          message: `${petNameForNotification} saved ${discountText} with "${offer.title}" at ${business.business_name}!`,
          data: {
            redemption_id: redemption.id,
            offer_id: offerId,
            offer_title: offer.title,
            business_id: businessId,
            business_name: business.business_name,
            discount_value: offer.discount_value,
            discount_type: offer.discount_type,
            pet_id: petId,
            pet_name: petNameForNotification,
          }
        });

      // Create rating prompt (triggers review request next day)
      const promptAfter = new Date();
      promptAfter.setHours(promptAfter.getHours() + 24);
      
      await supabaseAdmin
        .from('rating_prompts')
        .insert({
          user_id: membership.user_id,
          business_id: businessId,
          redemption_id: redemption.id,
          prompt_after: promptAfter.toISOString(),
        });

      // Create delayed review reminder notification
      await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: membership.user_id,
          type: 'review_request',
          title: `How was your visit to ${business.business_name}? ⭐`,
          message: `You recently used "${offer.title}" — tap here to leave a review and help other pet parents!`,
          data: {
            business_id: businessId,
            business_name: business.business_name,
            redemption_id: redemption.id,
            action_url: `/business/${businessId}`,
          }
        });

      // Track analytics event for admin dashboard
      await supabaseAdmin
        .from('analytics_events')
        .insert({
          user_id: membership.user_id,
          event_type: 'offer_redeem',
          entity_type: 'offer',
          entity_id: offerId,
          entity_name: offer.title,
          metadata: {
            business_id: businessId,
            business_name: business.business_name,
            redemption_id: redemption.id,
          }
        });

      return new Response(
        JSON.stringify({
          success: true,
          redemption: {
            id: redemption.id,
            offer_title: offer.title,
            discount: discountText,
            business_name: business.business_name,
            redeemed_at: redemption.redeemed_at,
            member_name: memberName,
            pet_names: petNameForNotification,
            member_number: membership.member_number,
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else {
      // Per-member: check if already redeemed within the frequency period (unless unlimited)

      // Validate pet_type restriction for per-member offers too
      if (petId && offer.pet_type) {
        const selectedPet = petsData?.find(p => p.id === petId);
        if (selectedPet && selectedPet.pet_type !== offer.pet_type) {
          const petTypeLabel = offer.pet_type === 'dog' ? 'dogs' : 'cats';
          return new Response(
            JSON.stringify({ 
              error: `This offer is only valid for ${petTypeLabel}`, 
              code: 'PET_TYPE_MISMATCH' 
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      if (redemptionFrequency !== 'unlimited') {
        let redemptionQuery = supabaseAdmin
          .from('offer_redemptions')
          .select('id')
          .eq('membership_id', membershipId)
          .eq('offer_id', offerId);
        
        if (frequencyDateFilter !== null) {
          redemptionQuery = redemptionQuery.gte('redeemed_at', frequencyDateFilter.toISOString());
        }

        const { data: existingRedemption } = await redemptionQuery.maybeSingle();

        if (existingRedemption) {
          const frequencyMessage = redemptionFrequency === 'one_time' 
            ? 'Offer already redeemed'
            : `You have already used this offer this ${redemptionFrequency === 'daily' ? 'day' : redemptionFrequency === 'weekly' ? 'week' : 'month'}`;
          
          return new Response(
            JSON.stringify({ error: frequencyMessage, code: 'ALREADY_REDEEMED' }),
            { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // Determine which pet name to store - if a specific pet was selected, use that
      let petNameForRedemption = petNames;
      if (petId) {
        const selectedPet = petsData?.find(p => p.id === petId);
        if (selectedPet) {
          petNameForRedemption = selectedPet.pet_name || 'Pet';
        }
      }

      // Insert the redemption
      const { data: redemption, error: redemptionError } = await supabaseAdmin
        .from('offer_redemptions')
        .insert({
          membership_id: membershipId,
          offer_id: offerId,
          business_id: businessId,
          redeemed_by_user_id: user.id,
          member_name: memberName,
          pet_names: petNameForRedemption,
          member_number: membership.member_number,
          pet_id: petId || null,
        })
        .select()
        .single();

      if (redemptionError) {
        console.error('Redemption error:', redemptionError.message);
        return new Response(
          JSON.stringify({ error: 'Failed to process redemption. Please try again.' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create notification for the member
      const discountText = offer.discount_type === 'percentage' 
        ? `${offer.discount_value}%` 
        : `€${offer.discount_value}`;

      await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: membership.user_id,
          type: 'redemption',
          title: 'Offer Redeemed! 🎉',
          message: `You saved ${discountText} with "${offer.title}" at ${business.business_name}!`,
          data: {
            redemption_id: redemption.id,
            offer_id: offerId,
            offer_title: offer.title,
            business_id: businessId,
            business_name: business.business_name,
            discount_value: offer.discount_value,
            discount_type: offer.discount_type,
          }
        });

      // Create rating prompt (triggers review request next day)
      const promptAfter = new Date();
      promptAfter.setHours(promptAfter.getHours() + 24);
      
      await supabaseAdmin
        .from('rating_prompts')
        .insert({
          user_id: membership.user_id,
          business_id: businessId,
          redemption_id: redemption.id,
          prompt_after: promptAfter.toISOString(),
        });

      // Create delayed review reminder notification
      await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: membership.user_id,
          type: 'review_request',
          title: `How was your visit to ${business.business_name}? ⭐`,
          message: `You recently used "${offer.title}" — tap here to leave a review and help other pet parents!`,
          data: {
            business_id: businessId,
            business_name: business.business_name,
            redemption_id: redemption.id,
            action_url: `/business/${businessId}`,
          }
        });

      // Track analytics event for admin dashboard
      await supabaseAdmin
        .from('analytics_events')
        .insert({
          user_id: membership.user_id,
          event_type: 'offer_redeem',
          entity_type: 'offer',
          entity_id: offerId,
          entity_name: offer.title,
          metadata: {
            business_id: businessId,
            business_name: business.business_name,
            redemption_id: redemption.id,
          }
        });

      return new Response(
        JSON.stringify({
          success: true,
          redemption: {
            id: redemption.id,
            offer_title: offer.title,
            discount: discountText,
            business_name: business.business_name,
            redeemed_at: redemption.redeemed_at,
            member_name: memberName,
            pet_names: petNameForRedemption,
            member_number: membership.member_number,
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('confirm-redemption error:', error instanceof Error ? error.message : 'Unknown error');
    return new Response(
      JSON.stringify({ error: 'An error occurred. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});