import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Helper to fetch all rows with pagination
    async function fetchAll(query: any) {
      const pageSize = 1000;
      let allData: any[] = [];
      let from = 0;
      while (true) {
        const { data, error } = await query.range(from, from + pageSize - 1);
        if (error) throw error;
        allData = allData.concat(data || []);
        if (!data || data.length < pageSize) break;
        from += pageSize;
      }
      return allData;
    }

    console.log("Starting membership expiry check...");

    // Find all active memberships that have been expired for more than 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoISO = sevenDaysAgo.toISOString();

    console.log(`Looking for memberships expired before: ${sevenDaysAgoISO}`);

    // Get memberships that are still active but expired more than 7 days ago (paginated)
    const expiredMemberships = await fetchAll(
      supabase
        .from("memberships")
        .select("id, user_id, member_number, expires_at")
        .eq("is_active", true)
        .lt("expires_at", sevenDaysAgoISO)
    );

    console.log(`Found ${expiredMemberships.length} memberships to deactivate`);

    if (!expiredMemberships || expiredMemberships.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No memberships to expire",
          count: 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Deactivate expired memberships
    const membershipIds = expiredMemberships.map((m) => m.id);
    
    const { error: updateError } = await supabase
      .from("memberships")
      .update({ is_active: false })
      .in("id", membershipIds);

    if (updateError) {
      console.error("Error deactivating memberships:", updateError);
      throw updateError;
    }

    console.log(`Successfully deactivated ${membershipIds.length} memberships`);

    // Create notifications for affected users
    const notifications = expiredMemberships.map((m) => ({
      user_id: m.user_id,
      type: "membership_expired",
      title: "Your Membership Has Expired",
      message: "Your Wooffy membership has expired. You still have access to our Community Hub, but upgrade to unlock all premium features!",
      data: { membership_id: m.id, member_number: m.member_number },
    }));

    const { error: notificationError } = await supabase
      .from("notifications")
      .insert(notifications);

    if (notificationError) {
      console.error("Error creating notifications:", notificationError);
      // Don't throw - this is not critical
    } else {
      console.log(`Created ${notifications.length} expiry notifications`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Deactivated ${membershipIds.length} expired memberships`,
        count: membershipIds.length,
        deactivated: expiredMemberships.map((m) => ({
          id: m.id,
          member_number: m.member_number,
          expired_at: m.expires_at,
        })),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in expire-memberships function:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to expire memberships";
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
