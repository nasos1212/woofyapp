import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationEmailRequest {
  email: string;
  subject: string;
  title: string;
  message: string;
  ctaText?: string;
  ctaUrl?: string;
  type?: "info" | "alert" | "birthday" | "expiry" | "offer";
}

const getTypeEmoji = (type: string): string => {
  switch (type) {
    case "birthday": return "🎂";
    case "expiry": return "⏰";
    case "offer": return "🎁";
    case "alert": return "🚨";
    default: return "📬";
  }
};

const getPreviewText = (type: string, title: string, message: string): string => {
  switch (type) {
    case "birthday": return `Birthday celebration! ${message.substring(0, 80)}...`;
    case "expiry": return `Membership reminder: ${message.substring(0, 80)}...`;
    case "offer": return `New offer for you! ${message.substring(0, 80)}...`;
    case "alert": return `Important: ${message.substring(0, 80)}...`;
    default: return `${title}: ${message.substring(0, 80)}...`;
  }
};

const handler = async (req: Request): Promise<Response> => {
  console.log("send-notification-email function called");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, subject, title, message, ctaText, ctaUrl, type = "info" }: NotificationEmailRequest = await req.json();
    console.log("Sending notification email to:", email, "type:", type);

    if (!email || !subject || !title || !message) {
      throw new Error("Email, subject, title, and message are required");
    }

    const emoji = getTypeEmoji(type);
    const previewText = getPreviewText(type, title, message);

    const emailResponse = await resend.emails.send({
      from: "Wooffy <hello@wooffy.app>",
      to: [email],
      subject: `${emoji} ${subject}`,
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
<div class="preview-text">${previewText}</div>
<div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
<div style="background: linear-gradient(135deg, #1A1A2E 0%, #2D2D44 100%); padding: 40px; text-align: center;">
<h1 style="color: #7DD3FC; margin: 0; font-size: 28px;">${emoji} ${title}</h1>
</div>
<div style="padding: 40px;">
<p style="font-size: 16px; color: #4b5563; line-height: 1.6; margin-bottom: 20px; white-space: pre-wrap;">${message}</p>
${ctaText && ctaUrl ? `<div style="text-align: center; margin: 30px 0;">
<a href="${ctaUrl}" style="display: inline-block; background: linear-gradient(135deg, #1A1A2E 0%, #2D2D44 100%); color: #7DD3FC; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: 600; font-size: 16px;">${ctaText}</a>
</div>` : ""}
</div>
<div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
<p style="font-size: 12px; color: #9ca3af; margin: 0;">© 2026 Wooffy. An effort to unite pet lovers all over Cyprus.</p>
</div>
</div>
</body>
</html>`,
    });

    console.log("Notification email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending notification email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
