import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Checking for membership anniversaries...');

    // Get today's date
    const today = new Date();
    const todayMonth = today.getMonth() + 1;
    const todayDay = today.getDate();
    const todayStr = today.toISOString().split('T')[0];

    // Find memberships where created_at matches today's month and day (anniversary)
    // and membership is at least 1 year old
    const { data: memberships, error } = await supabase
      .from('memberships')
      .select('id, user_id, created_at, is_active, plan_type')
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching memberships:', error);
      throw error;
    }

    let notificationsSent = 0;

    for (const membership of (memberships || [])) {
      const createdAt = new Date(membership.created_at);
      const createdMonth = createdAt.getMonth() + 1;
      const createdDay = createdAt.getDate();

      // Check if today is the anniversary (same month & day)
      if (createdMonth !== todayMonth || createdDay !== todayDay) continue;

      // Calculate years
      const years = today.getFullYear() - createdAt.getFullYear();
      if (years < 1) continue;

      // Check if already notified today
      const { data: existing } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', membership.user_id)
        .eq('type', 'anniversary')
        .gte('created_at', `${todayStr}T00:00:00Z`)
        .lte('created_at', `${todayStr}T23:59:59Z`)
        .maybeSingle();

      if (existing) continue;

      // Get member profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', membership.user_id)
        .single();

      const name = profile?.full_name || 'there';
      const yearText = years === 1 ? '1 year' : `${years} years`;

      await supabase
        .from('notifications')
        .insert({
          user_id: membership.user_id,
          type: 'anniversary',
          title: `🎊 Happy ${yearText} with Wooffy!`,
          message: `Hey ${name}, today marks ${yearText} since you joined the Wooffy family! Thank you for being an amazing pet parent. We're so glad you're part of the pack! 🐾`,
          data: {
            years,
            membership_id: membership.id,
          }
        });

      notificationsSent++;
      console.log(`Anniversary notification sent to user ${membership.user_id} (${yearText})`);
    }

    console.log(`Completed: sent ${notificationsSent} anniversary notifications`);

    return new Response(JSON.stringify({
      message: `Sent ${notificationsSent} anniversary notifications`,
      notificationsSent,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('notify-member-anniversaries error:', error instanceof Error ? error.message : 'Unknown error');
    return new Response(
      JSON.stringify({ error: 'An error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
