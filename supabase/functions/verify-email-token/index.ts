import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyTokenRequest {
  token: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("verify-email-token function called");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { token }: VerifyTokenRequest = await req.json();
    console.log("Verifying token:", token?.substring(0, 10) + "...");

    if (!token) {
      throw new Error("Token is required");
    }

    // Find the token in the database
    const { data: tokenData, error: tokenError } = await supabase
      .from('email_verification_tokens')
      .select('*')
      .eq('token', token)
      .is('verified_at', null)
      .single();

    if (tokenError || !tokenData) {
      console.error("Token not found or already used:", tokenError);
      return new Response(
        JSON.stringify({ success: false, error: "Invalid or expired verification link" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if token is expired
    if (new Date(tokenData.expires_at) < new Date()) {
      console.error("Token expired");
      return new Response(
        JSON.stringify({ success: false, error: "Verification link has expired. Please request a new one." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Mark token as verified
    const { error: updateTokenError } = await supabase
      .from('email_verification_tokens')
      .update({ verified_at: new Date().toISOString() })
      .eq('id', tokenData.id);

    if (updateTokenError) {
      console.error("Failed to update token:", updateTokenError);
      throw new Error("Failed to verify token");
    }

    // Update user profile as verified
    const { error: updateProfileError } = await supabase
      .from('profiles')
      .update({ email_verified: true })
      .eq('user_id', tokenData.user_id);

    if (updateProfileError) {
      console.error("Failed to update profile:", updateProfileError);
      throw new Error("Failed to update profile verification status");
    }

    // Send welcome email now that they're verified
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', tokenData.user_id)
        .single();
      
      // Call welcome email function via direct HTTP since we're in edge function
      const response = await fetch(`${supabaseUrl}/functions/v1/send-welcome-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          email: tokenData.email,
          fullName: profile?.full_name || ''
        })
      });
      
      if (!response.ok) {
        console.error("Welcome email failed:", await response.text());
      }
    } catch (welcomeErr) {
      console.error("Error sending welcome email:", welcomeErr);
      // Don't fail the verification for welcome email issues
    }

    console.log("Email verified successfully for user:", tokenData.user_id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email verified successfully!",
        email: tokenData.email 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error verifying email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
