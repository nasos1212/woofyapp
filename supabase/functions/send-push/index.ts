// Edge function: send-push
// Sends an Apple push notification (APNs) for a newly created notification.
// Invoked by the `on_notification_created` database trigger with an internal
// shared secret stored in the private `app_secrets` table.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { SignJWT, importPKCS8 } from "npm:jose@5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// APNs configuration. Team ID / topic are fixed for the Wooffy iOS app;
// the signing key and key ID come from project secrets.
const APNS_TEAM_ID = Deno.env.get("APNS_TEAM_ID") ?? "XC7893VNBD";
const APNS_TOPIC = "app.wooffy.ios";
const APNS_HOST = "https://api.push.apple.com";
const APNS_SANDBOX_HOST = "https://api.sandbox.push.apple.com";

let cachedApnsToken: { value: string; exp: number } | null = null;

async function getApnsToken(): Promise<string | null> {
  const keyId = Deno.env.get("APNS_KEY_ID");
  const p8 = Deno.env.get("APNS_KEY_P8");
  if (!keyId || !p8) return null;

  const now = Math.floor(Date.now() / 1000);
  if (cachedApnsToken && cachedApnsToken.exp - 120 > now) {
    return cachedApnsToken.value;
  }

  try {
    const privateKey = await importPKCS8(p8.replace(/\\n/g, "\n"), "ES256");
    const token = await new SignJWT({})
      .setProtectedHeader({ alg: "ES256", kid: keyId })
      .setIssuedAt(now)
      .setExpirationTime(now + 3600)
      .setIssuer(APNS_TEAM_ID)
      .sign(privateKey);
    cachedApnsToken = { value: token, exp: now + 3600 };
    return token;
  } catch (error) {
    console.error("Failed to sign APNs token:", error);
    return null;
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, supabaseServiceKey);

    // Validate the internal trigger secret.
    const providedSecret = req.headers.get("X-Internal-Secret");
    const { data: secretRow } = await admin
      .from("app_secrets")
      .select("value")
      .eq("key", "push_webhook_secret")
      .maybeSingle();

    if (!secretRow?.value || providedSecret !== secretRow.value) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const body = await req.json().catch(() => null);
    const notificationId: string | undefined = body?.notification_id;
    if (!notificationId || !UUID_REGEX.test(notificationId)) {
      return new Response(
        JSON.stringify({ error: "Invalid notification_id" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Fetch the notification.
    const { data: notification } = await admin
      .from("notifications")
      .select("id, user_id, type, title, message, push_sent_at")
      .eq("id", notificationId)
      .maybeSingle();

    if (!notification || notification.push_sent_at) {
      return new Response(
        JSON.stringify({ success: true, skipped: true }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Registering the APNs signing key in the project marks pushes as
    // delivered going forward; without it there is nothing to send yet.
    const apnsToken = await getApnsToken();
    if (!apnsToken) {
      console.log("APNs key not configured yet — skipping push for", notificationId);
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: "apns_not_configured" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Exact unread count becomes the home-screen badge number.
    const { count: unreadCount } = await admin
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", notification.user_id)
      .eq("read", false);

    const { data: tokens } = await admin
      .from("push_tokens")
      .select("token")
      .eq("user_id", notification.user_id);

    if (!tokens || tokens.length === 0) {
      // No registered device — nothing to deliver.
      const { error: markErr } = await admin
        .from("notifications")
        .update({ push_sent_at: new Date().toISOString() })
        .eq("id", notificationId);
      if (markErr) console.error("Failed to mark notification:", markErr);
      return new Response(
        JSON.stringify({ success: true, sent: 0, reason: "no_devices" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const payload = JSON.stringify({
      aps: {
        alert: {
          title: String(notification.title ?? "").slice(0, 120),
          body: String(notification.message ?? "").slice(0, 200),
        },
        sound: "default",
        badge: unreadCount ?? 1,
      },
      notification_id: notification.id,
      type: notification.type ?? "",
    });

    let delivered = 0;
    for (const { token } of tokens) {
      try {
        const post = (host: string) =>
          fetch(`${host}/3/device/${token}`, {
            method: "POST",
            headers: {
              authorization: `bearer ${apnsToken}`,
              "apns-topic": APNS_TOPIC,
              "apns-push-type": "alert",
              "Content-Type": "application/json",
            },
            body: payload,
          });

        let res = await post(APNS_HOST);

        // Devices running a build launched from Xcode hold a sandbox token.
        // The same key works there, so retry once against the sandbox host.
        if (res.status === 400) {
          const body = await res.text().catch(() => "");
          if (body.includes("BadDeviceToken")) {
            res = await post(APNS_SANDBOX_HOST);
          } else {
            console.warn(`APNs 400 for token ${token.slice(0, 8)}…:`, body);
          }
        }

        if (res.status === 200) {
          delivered += 1;
        } else if (res.status === 410 || res.status === 404) {
          // Device token no longer valid — clean it up.
          await admin.from("push_tokens").delete().eq("token", token);
        } else {
          const errText = await res.text().catch(() => "");
          console.warn(`APNs ${res.status} for token ${token.slice(0, 8)}…:`, errText);
        }
      } catch (error) {
        console.error("APNs request failed:", error);
      }
    }

    const { error: markError } = await admin
      .from("notifications")
      .update({ push_sent_at: new Date().toISOString() })
      .eq("id", notificationId);
    if (markError) console.error("Failed to mark notification:", markError);

    return new Response(
      JSON.stringify({ success: true, sent: delivered }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    console.error("send-push error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
