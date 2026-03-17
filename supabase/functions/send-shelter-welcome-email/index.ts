import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ShelterWelcomeRequest {
  email: string;
  shelterName: string;
  contactName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-shelter-welcome-email function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, shelterName, contactName }: ShelterWelcomeRequest = await req.json();
    console.log("Sending shelter welcome email to:", email);

    if (!email || !shelterName) {
      throw new Error("Email and shelter name are required");
    }

    const greeting = contactName ? `Hi ${contactName},` : "Hi there,";

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  .preview-text { display: none; max-height: 0; overflow: hidden; }
</style>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb; margin: 0; padding: 40px 20px;">
<div class="preview-text">Great news! ${shelterName} has been approved on Wooffy.</div>
<div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
<div style="background: linear-gradient(135deg, #1A1A2E 0%, #2D2D44 100%); padding: 40px; text-align: center;">
<h1 style="color: #7DD3FC; margin: 0; font-size: 28px;">Welcome to Wooffy! 🐾</h1>
<p style="color: #94a3b8; margin: 10px 0 0; font-size: 16px;">Your shelter has been approved</p>
</div>
<div style="padding: 40px;">
<p style="font-size: 18px; color: #1f2937; margin-bottom: 20px;">${greeting}</p>
<p style="font-size: 16px; color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
Great news! <strong>${shelterName}</strong> has been approved on Wooffy. Thank you for the incredible work you do for animals in Cyprus — we're honoured to support your mission!
</p>
<p style="font-size: 16px; color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
Here's what you can do next:
</p>
<ul style="font-size: 16px; color: #4b5563; line-height: 1.8; margin-bottom: 30px; padding-left: 20px;">
<li>🐶 List pets available for adoption</li>
<li>📸 Upload photos and tell your shelter's story</li>
<li>📩 Receive and manage adoption inquiries</li>
<li>💛 Connect with the Wooffy community</li>
</ul>
<div style="text-align: center; margin: 30px 0;">
<a href="https://www.wooffy.app/shelter" style="display: inline-block; background: linear-gradient(135deg, #1A1A2E 0%, #2D2D44 100%); color: #7DD3FC; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: 600; font-size: 16px;">Go to Your Dashboard</a>
</div>
<p style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 30px;">
Questions? Reply to this email — we're always here to help!
</p>
</div>
<div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
<p style="font-size: 12px; color: #9ca3af; margin: 0;">© 2026 Wooffy. An effort to unite pet lovers all over Cyprus. 💫</p>
</div>
</div>
</body>
</html>`;

    const emailResponse = await resend.emails.send({
      from: "Wooffy <hello@wooffy.app>",
      to: [email],
      subject: `Welcome to Wooffy, ${shelterName}! 🐾`,
      html: htmlContent,
    });

    console.log("Shelter welcome email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending shelter welcome email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
