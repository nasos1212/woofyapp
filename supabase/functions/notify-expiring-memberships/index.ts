import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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

    // Fetch active memberships expiring within 30 days
    const { data: expiringMemberships, error: fetchError } = await supabase
      .from("memberships")
      .select("id, user_id, expires_at, plan_type")
      .eq("is_active", true)
      .lte("expires_at", thirtyDaysFromNow.toISOString())
      .gt("expires_at", now.toISOString());

    if (fetchError) {
      console.error("Error fetching expiring memberships:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${expiringMemberships?.length || 0} expiring memberships`);

    // Get user IDs to fetch profiles
    const userIds = [...new Set(expiringMemberships?.map(m => m.user_id) || [])];
    
    // Fetch profiles for these users
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, email")
      .in("user_id", userIds);
    
    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

    const notifications: { 
      userId: string; 
      type: string; 
      title: string; 
      message: string; 
      daysLeft: number; 
      membershipId: string;
      email: string;
      fullName: string;
    }[] = [];

    for (const membership of expiringMemberships || []) {
      const expiryDate = new Date(membership.expires_at);
      const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const profile = profileMap.get(membership.user_id);
      
      if (!profile?.email) {
        console.log(`No email found for user ${membership.user_id}, skipping`);
        continue;
      }
      
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
            email: profile.email,
            fullName: profile.full_name || "",
          });
        }
      }
    }

    console.log(`Sending ${notifications.length} new notifications`);

    let emailsSent = 0;
    let emailsFailed = 0;

    // Send notifications
    for (const notif of notifications) {
      // Insert in-app notification
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

      // Send email notification
      try {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + notif.daysLeft);
        
        const previewText = `Your Wooffy membership expires in ${notif.daysLeft} day${notif.daysLeft !== 1 ? 's' : ''} - renew now to keep your benefits!`;
        
        await resend.emails.send({
          from: "Wooffy <hello@wooffy.app>",
          to: [notif.email],
          subject: `⏰ ${notif.title}`,
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                  .preview-text { display: none; max-height: 0; overflow: hidden; }
                </style>
              </head>
              <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb; margin: 0; padding: 40px 20px;">
                <div class="preview-text">${previewText}</div>
                <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                  <div style="background: linear-gradient(135deg, #1A1A2E 0%, #2D2D44 100%); padding: 40px; text-align: center;">
                    <h1 style="color: #7DD3FC; margin: 0; font-size: 28px;">⏰ Membership Reminder</h1>
                  </div>
                  <div style="padding: 40px;">
                    <p style="font-size: 18px; color: #1f2937; margin-bottom: 20px;">
                      Hi${notif.fullName ? ` ${notif.fullName}` : ""},
                    </p>
                    <p style="font-size: 16px; color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
                      ${notif.message}
                    </p>
                    <div style="background-color: #E0F2FE; border-radius: 8px; padding: 16px; margin-bottom: 20px; border-left: 4px solid #7DD3FC;">
                      <p style="font-size: 14px; color: #1A1A2E; margin: 0;">
                        <strong>Expiry Date:</strong> ${expiryDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="https://www.wooffy.app/member" style="display: inline-block; background: linear-gradient(135deg, #1A1A2E 0%, #2D2D44 100%); color: #7DD3FC; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                        Renew Membership
                      </a>
                    </div>
                    <p style="font-size: 14px; color: #6b7280; text-align: center;">
                      Don't lose access to exclusive pet discounts across Cyprus!
                    </p>
                  </div>
                  <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="font-size: 12px; color: #9ca3af; margin: 0;">
                      © 2026 Wooffy. Made with ❤️ for pets in Cyprus.
                    </p>
                  </div>
                </div>
              </body>
            </html>
          `,
        });
        emailsSent++;
        console.log(`Email sent to ${notif.email}`);
      } catch (emailError) {
        emailsFailed++;
        console.error(`Failed to send email to ${notif.email}:`, emailError);
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
      emailsSent,
      emailsFailed,
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
