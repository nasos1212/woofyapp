import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-password-reset function called");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: PasswordResetRequest = await req.json();
    console.log("Processing password reset request");

    if (!email) {
      throw new Error("Email is required");
    }

    // Create admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Check if user exists in our system (profiles table)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, user_id")
      .eq("email", email.trim().toLowerCase())
      .maybeSingle();

    if (profileError) {
      console.error("Error checking profile:", profileError);
    }

    // If no profile found, return success anyway (security: don't reveal if email exists)
    if (!profile) {
      console.log("No profile found for email - returning success silently");
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // User exists - now verify they're a legitimate user type (member, business, or shelter)
    const [membershipResult, businessResult, shelterResult] = await Promise.all([
      supabaseAdmin.from("memberships").select("id").eq("user_id", profile.user_id).maybeSingle(),
      supabaseAdmin.from("businesses").select("id").eq("user_id", profile.user_id).maybeSingle(),
      supabaseAdmin.from("shelters").select("id").eq("user_id", profile.user_id).maybeSingle(),
    ]);

    // Also check for user roles (freemium members have 'member' role but no membership record)
    const { data: userRole } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", profile.user_id)
      .maybeSingle();

    const hasMembership = !!membershipResult.data;
    const hasBusiness = !!businessResult.data;
    const hasShelter = !!shelterResult.data;
    const hasRole = !!userRole;

    // If user has no membership, business, shelter, or role - they're not a real user
    if (!hasMembership && !hasBusiness && !hasShelter && !hasRole) {
      console.log("User has no valid account type - returning success silently");
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log("Valid user found, generating reset link");

    // Generate the password reset link using admin API (doesn't send an email)
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: email.trim(),
      options: {
        redirectTo: "https://www.wooffy.app/reset-password",
      },
    });

    if (linkError) {
      console.error("Error generating reset link:", linkError);
      // Still return success to not reveal if user exists
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const resetUrl = linkData.properties?.action_link;
    if (!resetUrl) {
      console.error("Failed to generate reset link");
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log("Reset link generated, sending branded email");

    const emailResponse = await resend.emails.send({
      from: "Wooffy <hello@wooffy.app>",
      to: [email],
      subject: "[Wooffy] Reset Your Password 🔐",
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
<div class="preview-text">Reset your Wooffy password - this link expires in 1 hour.</div>
<div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
<div style="background: linear-gradient(135deg, #1A1A2E 0%, #2D2D44 100%); padding: 40px; text-align: center;">
<img src="https://www.wooffy.app/wooffy-logo.png" alt="Wooffy" style="height: 50px; margin-bottom: 16px;" />
<h1 style="color: #7DD3FC; margin: 0; font-size: 28px;">Password Reset 🔐</h1>
</div>
<div style="padding: 40px;">
<p style="font-size: 16px; color: #4b5563; line-height: 1.6; margin-bottom: 20px;">We received a request to reset your Wooffy password. Click the button below to set a new password:</p>
<div style="text-align: center; margin: 30px 0;">
<a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #1A1A2E 0%, #2D2D44 100%); color: #7DD3FC; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: 600; font-size: 16px;">Reset Password</a>
</div>
<p style="font-size: 14px; color: #6b7280; line-height: 1.6; margin-bottom: 20px;">This link will expire in 1 hour for security reasons.</p>
<p style="font-size: 14px; color: #6b7280; line-height: 1.6;">If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.</p>
</div>
<div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
<p style="font-size: 12px; color: #9ca3af; margin: 0;">© 2026 Wooffy. Made with ❤️ for pets in Cyprus.</p>
</div>
</div>
</body>
</html>`,
    });

    console.log("Password reset email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in password reset:", error);
    // Always return success to not reveal any information
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
