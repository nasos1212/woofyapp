import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BulkEmailRequest {
  audience: "all_users" | "all_members" | "active_members" | "expiring_soon";
  subject: string;
  title: string;
  message: string;
  ctaText?: string;
  ctaUrl?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-bulk-email function called");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { audience, subject, title, message, ctaText, ctaUrl }: BulkEmailRequest = await req.json();
    console.log("Sending bulk email to audience:", audience);

    if (!audience || !subject || !title || !message) {
      throw new Error("Audience, subject, title, and message are required");
    }

    // Get users based on audience
    let emails: string[] = [];

    if (audience === "all_users") {
      const { data, error } = await supabase.from("profiles").select("email");
      if (error) throw error;
      emails = (data || []).map((p: { email: string }) => p.email).filter(Boolean);
    } else if (audience === "all_members") {
      const { data, error } = await supabase
        .from("memberships")
        .select("user_id, profiles!inner(email)");
      if (error) throw error;
      emails = [...new Set((data || []).map((m: any) => m.profiles?.email).filter(Boolean))];
    } else if (audience === "active_members") {
      const { data, error } = await supabase
        .from("memberships")
        .select("user_id, profiles!inner(email)")
        .eq("is_active", true)
        .gt("expires_at", new Date().toISOString());
      if (error) throw error;
      emails = [...new Set((data || []).map((m: any) => m.profiles?.email).filter(Boolean))];
    } else if (audience === "expiring_soon") {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      const { data, error } = await supabase
        .from("memberships")
        .select("user_id, profiles!inner(email)")
        .eq("is_active", true)
        .lt("expires_at", thirtyDaysFromNow.toISOString())
        .gt("expires_at", new Date().toISOString());
      if (error) throw error;
      emails = [...new Set((data || []).map((m: any) => m.profiles?.email).filter(Boolean))];
    }

    console.log("Found", emails.length, "recipients");

    if (emails.length === 0) {
      return new Response(JSON.stringify({ success: true, sent: 0, message: "No recipients found" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Send emails in batches (Resend batch limit is 100)
    const batchSize = 100;
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      
      for (const email of batch) {
        try {
          await resend.emails.send({
            from: "Wooffy <hello@wooffy.app>",
            to: [email],
            subject: subject,
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
<div class="preview-text">${message.substring(0, 100)}...</div>
<div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
<div style="background: linear-gradient(135deg, #1A1A2E 0%, #2D2D44 100%); padding: 40px; text-align: center;">
<img src="https://qvdrwfltbqhlwkqndpdp.supabase.co/storage/v1/object/public/email-assets/wooffy-logo.png" alt="Wooffy" width="60" height="60" style="margin-bottom: 16px;">
<h1 style="color: #7DD3FC; margin: 0; font-size: 28px;">📬 ${title}</h1>
</div>
<div style="padding: 40px;">
<p style="font-size: 16px; color: #4b5563; line-height: 1.6; margin-bottom: 20px; white-space: pre-wrap;">${message}</p>
${ctaText && ctaUrl ? `<div style="text-align: center; margin: 30px 0;">
<a href="${ctaUrl}" style="display: inline-block; background: linear-gradient(135deg, #1A1A2E 0%, #2D2D44 100%); color: #7DD3FC; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: 600; font-size: 16px;">${ctaText}</a>
</div>` : ""}
</div>
<div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
<p style="font-size: 12px; color: #9ca3af; margin: 0;">© 2026 Wooffy. Made with ❤️ for pets in Cyprus.</p>
</div>
</div>
</body>
</html>`,
          });
          successCount++;
        } catch (e) {
          console.error("Failed to send to:", email, e);
          errorCount++;
        }
      }
    }

    console.log("Bulk email completed. Success:", successCount, "Errors:", errorCount);

    return new Response(JSON.stringify({ 
      success: true, 
      sent: successCount, 
      failed: errorCount,
      total: emails.length 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending bulk email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
