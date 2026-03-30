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

    // Find verified business/shelter users who signed up >24h ago
    // but have NOT created their business/shelter record yet
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    // Get business role users verified 24-48h ago
    const { data: businessUsers } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'business');

    const { data: shelterUsers } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'shelter');

    const allTargetUserIds = [
      ...(businessUsers || []).map(u => u.user_id),
      ...(shelterUsers || []).map(u => u.user_id),
    ];

    if (allTargetUserIds.length === 0) {
      console.log("No business/shelter users found");
      return new Response(JSON.stringify({ success: true, sent: 0 }), {
        status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get profiles for these users — verified, created 24-48h ago
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, email, full_name')
      .eq('email_verified', true)
      .lt('created_at', twentyFourHoursAgo)
      .gt('created_at', fortyEightHoursAgo)
      .in('user_id', allTargetUserIds);

    if (!profiles || profiles.length === 0) {
      console.log("No eligible users for nudge email");
      return new Response(JSON.stringify({ success: true, sent: 0 }), {
        status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    let sentCount = 0;

    for (const profile of profiles) {
      // Determine role
      const isBusiness = (businessUsers || []).some(u => u.user_id === profile.user_id);
      const isShelter = (shelterUsers || []).some(u => u.user_id === profile.user_id);

      // Check if they already created their record
      if (isBusiness) {
        const { data: biz } = await supabase
          .from('businesses')
          .select('id')
          .eq('user_id', profile.user_id)
          .maybeSingle();
        if (biz) continue; // Already onboarded
      }
      if (isShelter) {
        const { data: shelter } = await supabase
          .from('shelters')
          .select('id')
          .eq('user_id', profile.user_id)
          .maybeSingle();
        if (shelter) continue; // Already onboarded
      }

      // Check we haven't already sent a nudge (prevent duplicates)
      const { data: existingNotif } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', profile.user_id)
        .eq('type', 'onboarding_nudge')
        .maybeSingle();

      if (existingNotif) continue;

      const role = isShelter ? 'shelter' : 'business';
      const roleName = isShelter ? 'shelter' : 'business';
      const firstName = profile.full_name?.split(' ')[0] || 'there';
      const dashboardUrl = isShelter
        ? 'https://www.wooffy.app/auth'
        : 'https://www.wooffy.app/auth';

      const subject = isShelter
        ? `${firstName}, your shelter profile is waiting! 🐾`
        : `${firstName}, your business profile is waiting! 🐾`;

      const htmlContent = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb; margin: 0; padding: 40px 20px;">
<div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
<div style="background: linear-gradient(135deg, #1A1A2E 0%, #2D2D44 100%); padding: 40px; text-align: center;">
<h1 style="color: #7DD3FC; margin: 0; font-size: 24px;">You're Almost There! 🐾</h1>
<p style="color: #94a3b8; margin: 10px 0 0; font-size: 16px;">Just one more step to get started</p>
</div>
<div style="padding: 40px;">
<p style="font-size: 18px; color: #1f2937; margin-bottom: 20px;">Hi ${firstName},</p>
<p style="font-size: 16px; color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
We noticed you verified your email but haven't finished setting up your ${roleName} profile yet. No worries — it only takes a couple of minutes!
</p>
${isShelter ? `
<p style="font-size: 16px; color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
Once set up, you'll be able to:
</p>
<ul style="font-size: 16px; color: #4b5563; line-height: 1.8; margin-bottom: 30px; padding-left: 20px;">
<li>🐕 List adoptable pets and reach hundreds of pet lovers</li>
<li>📋 Manage adoption inquiries directly from your dashboard</li>
<li>📸 Showcase your shelter with photos and updates</li>
<li>🤝 Connect with the Wooffy community across Cyprus</li>
</ul>` : `
<p style="font-size: 16px; color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
Once set up, you'll be able to:
</p>
<ul style="font-size: 16px; color: #4b5563; line-height: 1.8; margin-bottom: 30px; padding-left: 20px;">
<li>🎁 Create exclusive offers for Wooffy members</li>
<li>📊 Track redemptions and customer engagement</li>
<li>🎂 Send birthday offers to your customers' pets</li>
<li>🗺️ Get listed on the pet-friendly places map</li>
</ul>`}
<div style="text-align: center; margin: 30px 0;">
<a href="${dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #1A1A2E 0%, #2D2D44 100%); color: #7DD3FC; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: 600; font-size: 16px;">Log In & Complete Setup</a>
</div>
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

        // Record that we sent the nudge to prevent duplicates
        await supabase.from('notifications').insert({
          user_id: profile.user_id,
          type: 'onboarding_nudge',
          title: 'Complete Your Profile',
          message: `Reminder to complete your ${roleName} profile setup.`,
          data: { role: roleName },
        });

        sentCount++;
        console.log(`Nudge email sent to ${profile.email} (${roleName})`);
      } catch (emailErr) {
        console.error(`Failed to send nudge to ${profile.email}:`, emailErr);
      }
    }

    console.log(`Nudge emails sent: ${sentCount}`);
    return new Response(JSON.stringify({ success: true, sent: sentCount }), {
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
