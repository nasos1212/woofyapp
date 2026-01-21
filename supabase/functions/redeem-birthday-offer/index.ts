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

    const { birthdayOfferId, businessId } = body;
    
    // Validate required fields exist
    if (!birthdayOfferId || !businessId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate UUID formats
    if (!isValidUUID(birthdayOfferId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid birthday offer ID format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!isValidUUID(businessId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid business ID format' }),
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

    // Get the birthday offer and verify it's not already redeemed
    const { data: birthdayOffer, error: offerError } = await supabaseAdmin
      .from('sent_birthday_offers')
      .select('id, pet_name, owner_user_id, discount_value, discount_type, redeemed_at, business_id')
      .eq('id', birthdayOfferId)
      .maybeSingle();

    if (offerError || !birthdayOffer) {
      console.error('Birthday offer fetch error:', offerError?.message);
      return new Response(
        JSON.stringify({ error: 'Birthday offer not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (birthdayOffer.redeemed_at) {
      return new Response(
        JSON.stringify({ error: 'Birthday offer already redeemed', code: 'ALREADY_REDEEMED' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update the birthday offer as redeemed
    const { error: updateError } = await supabaseAdmin
      .from('sent_birthday_offers')
      .update({ 
        redeemed_at: new Date().toISOString(),
        redeemed_by_business_id: businessId
      })
      .eq('id', birthdayOfferId);

    if (updateError) {
      console.error('Update error:', updateError.message);
      return new Response(
        JSON.stringify({ error: 'Failed to redeem birthday offer' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create notification for the member
    const discountText = birthdayOffer.discount_type === 'percentage' 
      ? `${birthdayOffer.discount_value}%` 
      : `€${birthdayOffer.discount_value}`;

    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: birthdayOffer.owner_user_id,
        type: 'redemption',
        title: 'Birthday Offer Redeemed! 🎂',
        message: `Your birthday offer for ${birthdayOffer.pet_name} was redeemed at ${business.business_name}. You saved ${discountText}!`,
        data: {
          birthday_offer_id: birthdayOfferId,
          business_id: businessId,
          business_name: business.business_name,
          discount_value: birthdayOffer.discount_value,
          discount_type: birthdayOffer.discount_type,
          pet_name: birthdayOffer.pet_name,
        }
      });

    // Track analytics event
    await supabaseAdmin
      .from('analytics_events')
      .insert({
        user_id: birthdayOffer.owner_user_id,
        event_type: 'birthday_offer_redeem',
        entity_type: 'birthday_offer',
        entity_id: birthdayOfferId,
        entity_name: `Birthday offer for ${birthdayOffer.pet_name}`,
        metadata: {
          business_id: businessId,
          business_name: business.business_name,
          original_business_id: birthdayOffer.business_id,
        }
      });

    console.log(`Birthday offer ${birthdayOfferId} redeemed at ${business.business_name}`);

    return new Response(
      JSON.stringify({
        success: true,
        redemption: {
          id: birthdayOfferId,
          pet_name: birthdayOffer.pet_name,
          discount: discountText,
          business_name: business.business_name,
          redeemed_at: new Date().toISOString(),
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('redeem-birthday-offer error:', error instanceof Error ? error.message : 'Unknown error');
    return new Response(
      JSON.stringify({ error: 'An error occurred. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});