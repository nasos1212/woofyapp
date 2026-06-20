import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const environment: StripeEnv =
      body.environment === "live" ? "live" : "sandbox";
    const action: "cancel" | "reactivate" = body.action;

    if (action !== "cancel" && action !== "reactivate") {
      throw new Error("Invalid action");
    }

    const { data: sub } = await supabase
      .from("subscriptions")
      .select("stripe_subscription_id, status")
      .eq("user_id", user.id)
      .eq("environment", environment)
      .in("status", ["active", "trialing", "past_due"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!sub?.stripe_subscription_id) {
      return new Response(
        JSON.stringify({ error: "No active subscription found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const stripe = createStripeClient(environment);

    if (action === "cancel") {
      // Cancel at period end — member keeps access until renewal date.
      // If a pending plan-change schedule exists, release it so it
      // doesn't try to start a new phase after cancellation.
      const subscription = await stripe.subscriptions.retrieve(
        sub.stripe_subscription_id as string,
      );
      const scheduleId = (subscription as any).schedule as string | null;
      if (scheduleId) {
        try {
          await stripe.subscriptionSchedules.release(scheduleId);
        } catch (e) {
          console.warn("Failed to release schedule (continuing):", e);
        }
      }
      await stripe.subscriptions.update(sub.stripe_subscription_id as string, {
        cancel_at_period_end: true,
      });
    } else {
      // Reactivate — clear the cancel flag
      await stripe.subscriptions.update(sub.stripe_subscription_id as string, {
        cancel_at_period_end: false,
      });
    }

    // Webhook will sync canonical state; mirror locally for instant UI.
    await supabase
      .from("subscriptions")
      .update({
        cancel_at_period_end: action === "cancel",
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_subscription_id", sub.stripe_subscription_id);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("update-subscription-status error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
