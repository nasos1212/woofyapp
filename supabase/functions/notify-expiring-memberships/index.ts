import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Starting expiring membership notification check...");

    // Get current date
    const now = new Date();
    const thirtyDaysFromNow = new Date(now);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    // Fetch active memberships expiring within 30 days with profile info
    const { data: expiringMemberships, error: fetchError } = await supabase
      .from("memberships")
      .select(`
        id,
        user_id,
        expires_at,
        plan_type,
        profiles!inner(full_name, email)
      `)
      .eq("is_active", true)
      .lte("expires_at", thirtyDaysFromNow.toISOString())
      .gt("expires_at", now.toISOString());

    if (fetchError) {
      console.error("Error fetching expiring memberships:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${expiringMemberships?.length || 0} expiring memberships`);

    const notifications: { userId: string; type: string; title: string; message: string; daysLeft: number; membershipId: string }[] = [];

    for (const membership of expiringMemberships || []) {
      const expiryDate = new Date(membership.expires_at);
      const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      let notificationType: string | null = null;
      let title = "";
      let message = "";

      // Determine notification type based on days left
      if (daysLeft <= 3) {
        notificationType = "expiry_3_days";
        title = "⚠️ Membership Expiring in 3 Days!";
        message = `Your Wooffy membership expires on ${expiryDate.toLocaleDateString()}. Renew now to keep enjoying exclusive discounts!`;
      } else if (daysLeft <= 7) {
        notificationType = "expiry_7_days";
        title = "📅 Membership Expiring Soon";
        message = `Your membership expires in ${daysLeft} days. Renew early and save with our loyalty discount!`;
      } else if (daysLeft <= 30) {
        notificationType = "expiry_30_days";
        title = "🔔 Membership Renewal Reminder";
        message = `Your Wooffy membership expires on ${expiryDate.toLocaleDateString()}. Plan ahead and renew to continue saving!`;
      }

      if (notificationType) {
        // Check if we already sent this notification
        const { data: existingNotification } = await supabase
          .from("membership_expiry_notifications")
          .select("id")
          .eq("membership_id", membership.id)
          .eq("notification_type", notificationType)
          .maybeSingle();

        if (!existingNotification) {
          notifications.push({
            userId: membership.user_id,
            type: notificationType,
            title,
            message,
            daysLeft,
            membershipId: membership.id,
          });
        }
      }
    }

    console.log(`Sending ${notifications.length} new notifications`);

    // Send notifications
    for (const notif of notifications) {
      // Insert notification
      const { error: notifError } = await supabase.from("notifications").insert({
        user_id: notif.userId,
        type: "membership_expiry",
        title: notif.title,
        message: notif.message,
        data: { days_left: notif.daysLeft, membership_id: notif.membershipId },
      });

      if (notifError) {
        console.error(`Error sending notification to ${notif.userId}:`, notifError);
        continue;
      }

      // Track that we sent this notification
      const { error: trackError } = await supabase.from("membership_expiry_notifications").insert({
        membership_id: notif.membershipId,
        user_id: notif.userId,
        notification_type: notif.type,
        days_until_expiry: notif.daysLeft,
      });

      if (trackError) {
        console.error(`Error tracking notification for ${notif.userId}:`, trackError);
      }
    }

    const result = {
      success: true,
      totalExpiring: expiringMemberships?.length || 0,
      notificationsSent: notifications.length,
      timestamp: now.toISOString(),
    };

    console.log("Notification job completed:", result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in notify-expiring-memberships:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
