import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerificationEmailRequest {
  email: string;
  userId: string;
  fullName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-verification-email function called");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { email, userId, fullName }: VerificationEmailRequest = await req.json();
    console.log("Sending verification email to:", email);

    if (!email || !userId) {
      throw new Error("Email and userId are required");
    }

    // Generate a secure token
    const token = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, '');
    
    // Store the token in the database
    const { error: insertError } = await supabase
      .from('email_verification_tokens')
      .insert({
        user_id: userId,
        email: email,
        token: token,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      });

    if (insertError) {
      console.error("Failed to store verification token:", insertError);
      throw new Error("Failed to create verification token");
    }

    // Build verification URL
    const verifyUrl = `https://www.wooffy.app/verify-email?token=${token}`;
    const greeting = fullName ? `Hi ${fullName},` : "Hi there,";

    const emailResponse = await resend.emails.send({
      from: "Wooffy <hello@wooffy.app>",
      to: [email],
      subject: "Verify Your Email - Wooffy 🐾",
      html: `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
.preview-text { display: none; max-height: 0; overflow: hidden; }
</style>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb; margin: 0; padding: 40px 20px;">
<div class="preview-text">Please verify your email to complete your Wooffy registration.</div>
<div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
<div style="background: linear-gradient(135deg, #1A1A2E 0%, #2D2D44 100%); padding: 40px; text-align: center;">
<h1 style="color: #7DD3FC; margin: 0; font-size: 28px;">Verify Your Email 🐾</h1>
</div>
<div style="padding: 40px;">
<p style="font-size: 18px; color: #1f2937; margin-bottom: 20px;">${greeting}</p>
<p style="font-size: 16px; color: #4b5563; line-height: 1.6; margin-bottom: 20px;">Thanks for signing up for Wooffy! Please click the button below to verify your email address and complete your registration.</p>
<div style="text-align: center; margin: 30px 0;">
<a href="${verifyUrl}" style="display: inline-block; background: linear-gradient(135deg, #1A1A2E 0%, #2D2D44 100%); color: #7DD3FC; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: 600; font-size: 16px;">Verify Email Address</a>
</div>
<p style="font-size: 14px; color: #6b7280; line-height: 1.6; margin-bottom: 20px;">This link will expire in 24 hours for security reasons.</p>
<p style="font-size: 14px; color: #6b7280; line-height: 1.6;">If you didn't create an account on Wooffy, you can safely ignore this email.</p>
</div>
<div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
<p style="font-size: 12px; color: #9ca3af; margin: 0;">© 2026 Wooffy. An effort to unite pet lovers all over Cyprus. 💫</p>
</div>
</div>
</body>
</html>`,
    });

    console.log("Verification email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending verification email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
