import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create service role client for cross-user operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get user's auth from request
    const authHeader = req.headers.get('Authorization');
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

    // Get current user (business owner)
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized', code: 'UNAUTHORIZED' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { membershipId, offerId, businessId } = await req.json();
    
    if (!membershipId || !offerId || !businessId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields', code: 'MISSING_FIELDS' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Confirming redemption: business=${businessId}, membership=${membershipId}, offer=${offerId}`);

    // Verify the business belongs to the current user
    const { data: business, error: businessError } = await supabaseClient
      .from('businesses')
      .select('id, business_name')
      .eq('id', businessId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (businessError || !business) {
      console.error('Business verification failed:', businessError);
      return new Response(
        JSON.stringify({ error: 'Business not found or unauthorized', code: 'UNAUTHORIZED' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get membership details (need admin client to read other users' memberships)
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('memberships')
      .select('id, user_id, member_number, pet_name')
      .eq('id', membershipId)
      .single();

    if (membershipError || !membership) {
      console.error('Membership not found:', membershipError);
      return new Response(
        JSON.stringify({ error: 'Membership not found', code: 'NOT_FOUND' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch pets for this membership
    const { data: petsData } = await supabaseAdmin
      .from('pets')
      .select('pet_name')
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
    
    const memberName = profileData?.full_name || 'Unknown';

    // Get offer details
    const { data: offer, error: offerError } = await supabaseAdmin
      .from('offers')
      .select('id, title, discount_value, discount_type, business_id')
      .eq('id', offerId)
      .single();

    if (offerError || !offer) {
      console.error('Offer not found:', offerError);
      return new Response(
        JSON.stringify({ error: 'Offer not found', code: 'NOT_FOUND' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if already redeemed
    const { data: existingRedemption } = await supabaseAdmin
      .from('offer_redemptions')
      .select('id')
      .eq('membership_id', membershipId)
      .eq('offer_id', offerId)
      .maybeSingle();

    if (existingRedemption) {
      return new Response(
        JSON.stringify({ error: 'Offer already redeemed', code: 'ALREADY_REDEEMED' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert the redemption using admin client (bypasses RLS)
    const { data: redemption, error: redemptionError } = await supabaseAdmin
      .from('offer_redemptions')
      .insert({
        membership_id: membershipId,
        offer_id: offerId,
        business_id: businessId,
        redeemed_by_user_id: user.id,
      })
      .select()
      .single();

    if (redemptionError) {
      console.error('Redemption insert failed:', redemptionError);
      return new Response(
        JSON.stringify({ error: 'Failed to record redemption', code: 'INSERT_FAILED' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Redemption recorded: ${redemption.id}`);

    // Create notification for the member
    const discountText = offer.discount_type === 'percentage' 
      ? `${offer.discount_value}%` 
      : `€${offer.discount_value}`;

    const { error: notificationError } = await supabaseAdmin
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

    if (notificationError) {
      console.error('Notification insert failed:', notificationError);
      // Don't fail the whole operation if notification fails
    } else {
      console.log(`Notification sent to user ${membership.user_id}`);
    }

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
          pet_names: petNames,
          member_number: membership.member_number,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in confirm-redemption function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', code: 'INTERNAL_ERROR' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
