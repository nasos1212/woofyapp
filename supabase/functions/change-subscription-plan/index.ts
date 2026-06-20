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

// Maps lookup keys → memberships.plan_type / max_pets (kept in sync with payments-webhook)
const PRICE_TO_PLAN: Record<string, { plan_type: string; max_pets: number }> = {
  wooffy_solo_yearly: { plan_type: "single", max_pets: 1 },
  wooffy_duo_yearly: { plan_type: "duo", max_pets: 2 },
  wooffy_pack_yearly: { plan_type: "family", max_pets: 5 },
};

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
    const newPriceLookupKey: string = body.priceId;
    const mode: "preview" | "confirm" = body.mode === "confirm" ? "confirm" : "preview";

    if (!newPriceLookupKey || !/^[a-zA-Z0-9_-]+$/.test(newPriceLookupKey)) {
      throw new Error("Invalid priceId");
    }
    if (!PRICE_TO_PLAN[newPriceLookupKey]) {
      throw new Error("Unknown plan");
    }

    // Find current active subscription
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("stripe_subscription_id, stripe_customer_id, price_id, status")
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

    if (sub.price_id === newPriceLookupKey) {
      return new Response(
        JSON.stringify({ error: "Already on this plan" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const stripe = createStripeClient(environment);

    // Resolve new price id from lookup key
    const prices = await stripe.prices.list({
      lookup_keys: [newPriceLookupKey],
    });
    if (!prices.data.length) throw new Error("New price not found");
    const newPrice = prices.data[0];

    // Fetch current subscription to get the item id
    const subscription = await stripe.subscriptions.retrieve(
      sub.stripe_subscription_id as string,
    );
    const currentItem = subscription.items.data[0];
    if (!currentItem) throw new Error("Subscription has no items");

    if (mode === "preview") {
      // Preview the prorated invoice
      const preview = await (stripe.invoices as any).createPreview({
        customer: sub.stripe_customer_id,
        subscription: sub.stripe_subscription_id,
        subscription_details: {
          items: [{ id: currentItem.id, price: newPrice.id }],
          proration_behavior: "always_invoice",
        },
      });

      return new Response(
        JSON.stringify({
          amountDue: preview.amount_due,
          currency: preview.currency,
          subtotal: preview.subtotal,
          total: preview.total,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Confirm: apply the plan change with proration billed immediately
    await stripe.subscriptions.update(sub.stripe_subscription_id as string, {
      items: [{ id: currentItem.id, price: newPrice.id }],
      proration_behavior: "always_invoice",
      payment_behavior: "error_if_incomplete",
      metadata: {
        ...(subscription.metadata || {}),
        userId: user.id,
      },
    });

    // Optimistically update memberships so UI reflects new plan immediately.
    // Webhook will also sync, but this avoids a UI delay.
    const mapping = PRICE_TO_PLAN[newPriceLookupKey];
    await supabase
      .from("memberships")
      .update({
        plan_type: mapping.plan_type,
        max_pets: mapping.max_pets,
      })
      .eq("user_id", user.id);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("change-subscription-plan error:", e);
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
