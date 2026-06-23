import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createStripeClient } from "../_shared/stripe.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GRACE_PERIOD_DAYS = 30;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claims, error: claimsError } = await userClient.auth.getClaims(
      authHeader.replace("Bearer ", ""),
    );
    if (claimsError || !claims?.claims?.sub) {
      return json({ error: "Unauthorized" }, 401);
    }
    const userId = claims.claims.sub as string;

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Members only: businesses & shelters must contact support
    const { data: roles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const roleSet = new Set((roles ?? []).map((r) => r.role));
    if (roleSet.has("business") || roleSet.has("shelter")) {
      return json(
        {
          error:
            "Partner accounts (businesses and shelters) must contact support to close their account, since active customer offers, redemptions or adoption inquiries may be affected.",
        },
        403,
      );
    }

    // Cancel any active paid Stripe subscription immediately (member is leaving)
    const { data: subs } = await admin
      .from("subscriptions")
      .select("id, stripe_subscription_id, environment, status")
      .eq("user_id", userId)
      .in("status", ["active", "trialing", "past_due"]);

    for (const sub of subs ?? []) {
      if (!sub.stripe_subscription_id) continue;
      try {
        const stripe = createStripeClient(
          (sub.environment === "live" ? "live" : "sandbox") as "live" | "sandbox",
        );
        await stripe.subscriptions.cancel(sub.stripe_subscription_id);
        await admin
          .from("subscriptions")
          .update({ status: "canceled", canceled_at: new Date().toISOString() })
          .eq("id", sub.id);
      } catch (e) {
        console.error("Stripe cancel failed for sub", sub.id, e);
      }
    }

    // Soft-delete the profile (30-day grace period)
    const now = new Date();
    const scheduledFor = new Date(now.getTime() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);

    const { error: updateError } = await admin
      .from("profiles")
      .update({
        deletion_requested_at: now.toISOString(),
        deletion_scheduled_for: scheduledFor.toISOString(),
      })
      .eq("user_id", userId);

    if (updateError) throw updateError;

    console.log(`Account deletion requested for ${userId}, scheduled ${scheduledFor.toISOString()}`);

    return json({
      success: true,
      scheduled_for: scheduledFor.toISOString(),
      grace_period_days: GRACE_PERIOD_DAYS,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("request-account-deletion error:", message);
    return json({ error: message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
