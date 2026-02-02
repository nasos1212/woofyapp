import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SupportNotificationRequest {
  conversationId?: string;
  subject?: string;
  message?: string;
  userId?: string;
  isReply?: boolean;
  // Affiliate inquiry fields
  type?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  audience?: string;
}

const audienceLabels: Record<string, string> = {
  friends_family: "Friends & Family",
  social_media: "Social Media Followers",
  pet_community: "Pet Community / Groups",
  workplace: "Colleagues / Workplace",
  clients: "My Clients / Customers",
  other: "Other",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: SupportNotificationRequest = await req.json();
    console.log("Received support notification request:", body);

    // Check if this is an affiliate inquiry
    if (body.type === "affiliate_inquiry") {
      return await handleAffiliateInquiry(body);
    }

    // Standard support notification flow
    const { conversationId, subject, message, userId, isReply } = body;

    // Validate required fields
    if (!conversationId || !subject || !message || !userId) {
      throw new Error("Missing required fields");
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("user_id", userId)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
    }

    const userName = profile?.full_name || "Unknown User";
    const userEmail = profile?.email || "No email";

    // Get user membership info if available
    const { data: membership } = await supabase
      .from("memberships")
      .select("member_number, plan_type")
      .eq("user_id", userId)
      .eq("is_active", true)
      .single();

    const memberInfo = membership 
      ? `Member #${membership.member_number} (${membership.plan_type})` 
      : "No active membership";

    // Send email notification to support team
    const emailSubject = isReply 
      ? `[Wooffy Support] Reply: ${subject}`
      : `[Wooffy Support] New Request: ${subject}`;

    const emailResponse = await resend.emails.send({
      from: "Wooffy Support <hello@wooffy.app>",
      to: ["hello@wooffy.app"],
      subject: emailSubject,
      html: `<!DOCTYPE html>
<html>
<head>
<style>
body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
.container { max-width: 600px; margin: 0 auto; padding: 20px; }
.header { background: linear-gradient(135deg, #1A1A2E, #2D2D44); color: #7DD3FC; padding: 20px; border-radius: 8px 8px 0 0; }
.content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; }
.user-info { background: white; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e5e7eb; }
.message-box { background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #7DD3FC; }
.footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
.btn { display: inline-block; background: #1A1A2E; color: #7DD3FC; padding: 12px 24px; text-decoration: none; border-radius: 6px; }
.preview-text { display: none; max-height: 0; overflow: hidden; }
</style>
</head>
<body>
<div class="preview-text">${isReply ? `Reply from ${userName}: ${subject}` : `New support request from ${userName}: ${subject}`}</div>
<div class="container">
<div class="header">
<h1 style="margin: 0;">🐾 ${isReply ? "New Reply" : "New Support Request"}</h1>
</div>
<div class="content">
<div class="user-info">
<h3 style="margin-top: 0;">User Information</h3>
<p><strong>Name:</strong> ${userName}</p>
<p><strong>Email:</strong> ${userEmail}</p>
<p><strong>Membership:</strong> ${memberInfo}</p>
<p><strong>Conversation ID:</strong> ${conversationId}</p>
</div>
<h3>Subject: ${subject}</h3>
<div class="message-box">
<p style="white-space: pre-wrap;">${message}</p>
</div>
<p style="margin-top: 20px;">
<a href="https://www.wooffy.app/admin" class="btn">View in Admin Dashboard</a>
</p>
</div>
<div class="footer">
<p>© 2026 Wooffy. This is an automated notification from Wooffy Support System</p>
</div>
</div>
</body>
</html>`,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailResponse }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in send-support-notification function:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

async function handleAffiliateInquiry(body: SupportNotificationRequest): Promise<Response> {
  const { fullName, email, phone, audience, message } = body;

  // Validate required fields
  if (!fullName || !email || !phone || !audience) {
    throw new Error("Missing required fields for affiliate inquiry");
  }

  const audienceLabel = audienceLabels[audience] || audience;

  console.log("Processing affiliate inquiry from:", fullName, email);

  // Send email notification to support team
  const emailResponse = await resend.emails.send({
    from: "Wooffy Affiliates <hello@wooffy.app>",
    to: ["hello@wooffy.app"],
    subject: `[Wooffy] New Affiliate Inquiry: ${fullName}`,
    html: `<!DOCTYPE html>
<html>
<head>
<style>
body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
.container { max-width: 600px; margin: 0 auto; padding: 20px; }
.header { background: linear-gradient(135deg, #1A1A2E, #2D2D44); color: #7DD3FC; padding: 20px; border-radius: 8px 8px 0 0; }
.content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
.info-card { background: white; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e5e7eb; }
.message-box { background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #7DD3FC; }
.footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
.highlight { background: #f0fdf4; padding: 10px; border-radius: 6px; border-left: 4px solid #22c55e; margin: 15px 0; }
.preview-text { display: none; max-height: 0; overflow: hidden; }
</style>
</head>
<body>
<div class="preview-text">New affiliate inquiry from ${fullName} (${audienceLabel})</div>
<div class="container">
<div class="header">
<h1 style="margin: 0;">🤝 New Affiliate Inquiry</h1>
</div>
<div class="content">
<div class="highlight">
<strong>Someone wants to join the affiliate program!</strong>
</div>

<div class="info-card">
<h3 style="margin-top: 0;">Contact Information</h3>
<p><strong>Name:</strong> ${fullName}</p>
<p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
<p><strong>Phone:</strong> <a href="tel:${phone}">${phone}</a></p>
</div>

<div class="info-card">
<h3 style="margin-top: 0;">Audience Type</h3>
<p><strong>${audienceLabel}</strong></p>
</div>

${message ? `
<div class="message-box">
<h3 style="margin-top: 0;">Additional Message</h3>
<p style="white-space: pre-wrap;">${message}</p>
</div>
` : ''}

<p style="margin-top: 20px; color: #6b7280; font-size: 14px;">
Reply directly to this email or contact ${fullName} at the details above to discuss the affiliate partnership.
</p>
</div>
<div class="footer">
<p>© 2026 Wooffy. This is an automated notification from Wooffy</p>
</div>
</div>
</body>
</html>`,
  });

  console.log("Affiliate inquiry email sent successfully:", emailResponse);

  return new Response(
    JSON.stringify({ success: true, emailResponse }),
    {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    }
  );
}

serve(handler);
