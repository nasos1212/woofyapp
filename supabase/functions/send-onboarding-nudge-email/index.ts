import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  console.log("send-onboarding-nudge-email function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = Date.now();

    // Windows: 24h nudge = verified 24-36h ago, 72h nudge = verified 72-84h ago
    const windows = [
      { label: "24h", notifType: "onboarding_nudge_24h", minMs: 24 * 3600_000, maxMs: 36 * 3600_000 },
      { label: "72h", notifType: "onboarding_nudge_72h", minMs: 72 * 3600_000, maxMs: 84 * 3600_000 },
    ];

    // Get all business & shelter user IDs
    const { data: businessUsers } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'business');

    const { data: shelterUsers } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'shelter');

    const businessIds = new Set((businessUsers || []).map(u => u.user_id));
    const shelterIds = new Set((shelterUsers || []).map(u => u.user_id));
    const allTargetIds = [...new Set([...businessIds, ...shelterIds])];

    if (allTargetIds.length === 0) {
      return new Response(JSON.stringify({ success: true, sent: 0 }), {
        status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    let totalSent = 0;

    for (const window of windows) {
      const windowStart = new Date(now - window.maxMs).toISOString();
      const windowEnd = new Date(now - window.minMs).toISOString();

      // Get verified profiles in this window
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, email, full_name')
        .eq('email_verified', true)
        .gt('created_at', windowStart)
        .lt('created_at', windowEnd)
        .in('user_id', allTargetIds);

      if (!profiles || profiles.length === 0) continue;

      for (const profile of profiles) {
        const isBusiness = businessIds.has(profile.user_id);
        const isShelter = shelterIds.has(profile.user_id);

        // Check if already onboarded
        if (isBusiness) {
          const { data: biz } = await supabase
            .from('businesses').select('id').eq('user_id', profile.user_id).maybeSingle();
          if (biz) continue;
        }
        if (isShelter) {
          const { data: shelter } = await supabase
            .from('shelters').select('id').eq('user_id', profile.user_id).maybeSingle();
          if (shelter) continue;
        }

        // Check if this specific nudge was already sent
        const { data: existing } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', profile.user_id)
          .eq('type', window.notifType)
          .maybeSingle();

        if (existing) continue;

        const role = isShelter ? 'shelter' : 'business';
        const firstName = profile.full_name?.split(' ')[0] || 'there';

        const is24h = window.label === "24h";

        const subject = is24h
          ? `${firstName}, your ${role} profile is waiting! 🐾`
          : `${firstName}, don't miss out — complete your ${role} setup 🐾`;

        const heading = is24h
          ? "You're Almost There! 🐾"
          : "We're Still Waiting for You! 🐾";

        const intro = is24h
          ? `We noticed you verified your email but haven't finished setting up your ${role} profile yet. No worries — it only takes a couple of minutes!`
          : `It's been a few days since you signed up, and your ${role} profile is still incomplete. We'd love to have you on board — and it only takes 2 minutes to get started!`;

        const benefitsList = isShelter
          ? `<li>🐕 List adoptable pets and reach hundreds of pet lovers</li>
<li>📋 Manage adoption inquiries directly from your dashboard</li>
<li>📸 Showcase your shelter with photos and updates</li>
<li>🤝 Connect with the Wooffy community across Cyprus</li>`
          : `<li>🎁 Create exclusive offers for Wooffy members</li>
<li>📊 Track redemptions and customer engagement</li>
<li>🎂 Send birthday offers to your customers' pets</li>
<li>🗺️ Get listed on the pet-friendly places map</li>`;

        const ctaText = is24h ? "Log In & Complete Setup" : "Finish Setup Now";

        const htmlContent = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb; margin: 0; padding: 40px 20px;">
<div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
<div style="background: linear-gradient(135deg, #1A1A2E 0%, #2D2D44 100%); padding: 40px; text-align: center;">
<h1 style="color: #7DD3FC; margin: 0; font-size: 24px;">${heading}</h1>
<p style="color: #94a3b8; margin: 10px 0 0; font-size: 16px;">Just one more step to get started</p>
</div>
<div style="padding: 40px;">
<p style="font-size: 18px; color: #1f2937; margin-bottom: 20px;">Hi ${firstName},</p>
<p style="font-size: 16px; color: #4b5563; line-height: 1.6; margin-bottom: 20px;">${intro}</p>
<p style="font-size: 16px; color: #4b5563; line-height: 1.6; margin-bottom: 20px;">Once set up, you'll be able to:</p>
<ul style="font-size: 16px; color: #4b5563; line-height: 1.8; margin-bottom: 30px; padding-left: 20px;">
${benefitsList}
</ul>
<div style="text-align: center; margin: 30px 0;">
<a href="https://www.wooffy.app/auth" style="display: inline-block; background: linear-gradient(135deg, #1A1A2E 0%, #2D2D44 100%); color: #7DD3FC; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: 600; font-size: 16px;">${ctaText}</a>
</div>
${!is24h ? `<div style="background-color: #fef3c7; border-radius: 8px; padding: 16px; margin: 20px 0; border-left: 4px solid #f59e0b;">
<p style="font-size: 14px; color: #92400e; margin: 0;">💡 Your account is already created and verified — just log in to pick up where you left off!</p>
</div>` : ''}
<p style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 30px;">
Need help? Just reply to this email — we're happy to assist!
</p>
</div>
<div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
<p style="font-size: 12px; color: #9ca3af; margin: 0;">© 2026 Wooffy. An effort to unite pet lovers all over Cyprus. 💫</p>
</div>
</div>
</body>
</html>`;

        try {
          await resend.emails.send({
            from: "Wooffy <hello@wooffy.app>",
            to: [profile.email],
            subject,
            html: htmlContent,
          });

          await supabase.from('notifications').insert({
            user_id: profile.user_id,
            type: window.notifType,
            title: is24h ? 'Complete Your Profile' : 'Profile Setup Reminder',
            message: `Reminder to complete your ${role} profile setup.`,
            data: { role, nudge: window.label },
          });

          totalSent++;
          console.log(`${window.label} nudge sent to ${profile.email} (${role})`);
        } catch (emailErr) {
          console.error(`Failed to send ${window.label} nudge to ${profile.email}:`, emailErr);
        }
      }
    }

    console.log(`Total nudge emails sent: ${totalSent}`);
    return new Response(JSON.stringify({ success: true, sent: totalSent }), {
      status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in onboarding nudge:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
