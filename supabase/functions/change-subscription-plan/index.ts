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

// Allowed lookup keys (kept in sync with payments-webhook)
const ALLOWED_PRICES = new Set([
  "wooffy_solo_yearly",
  "wooffy_duo_yearly",
  "wooffy_pack_yearly",
]);

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
    const newPriceLookupKey: string = body.priceId ?? "";
    const mode: "preview" | "confirm" | "status" | "cancel_pending" =
      body.mode === "confirm"
        ? "confirm"
        : body.mode === "status"
          ? "status"
          : body.mode === "cancel_pending"
            ? "cancel_pending"
            : "preview";

    if (mode === "preview" || mode === "confirm") {
      if (!newPriceLookupKey || !/^[a-zA-Z0-9_-]+$/.test(newPriceLookupKey)) {
        throw new Error("Invalid priceId");
      }
      if (!ALLOWED_PRICES.has(newPriceLookupKey)) {
        throw new Error("Unknown plan");
      }
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

    const stripe = createStripeClient(environment);

    // Helper: read pending plan change from existing schedule (if any)
    const readPending = async (subscription: any) => {
      const scheduleId = subscription?.schedule as string | null;
      if (!scheduleId) return null;
      const sched = await stripe.subscriptionSchedules.retrieve(scheduleId);
      if (!sched || sched.status === "released" || sched.status === "canceled") return null;
      const nextPhase = sched.phases?.[1];
      if (!nextPhase) return null;
      const nextPriceId = (nextPhase.items?.[0] as any)?.price as string | undefined;
      if (!nextPriceId) return null;
      // Resolve to lookup key
      let lookupKey: string | null = (sched.metadata?.pending_plan_change as string) || null;
      if (!lookupKey) {
        try {
          const priceObj = await stripe.prices.retrieve(nextPriceId);
          lookupKey = priceObj.lookup_key ?? null;
        } catch { /* noop */ }
      }
      return {
        scheduleId,
        priceId: lookupKey,
        scheduledFor: (nextPhase.start_date as number) ?? null,
      };
    };

    // STATUS: return current pending change (if any) without modifying anything
    if (mode === "status") {
      const subscription = await stripe.subscriptions.retrieve(sub.stripe_subscription_id as string);
      const pending = await readPending(subscription);
      return new Response(
        JSON.stringify({ pending }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // CANCEL_PENDING: release any active schedule so the subscription continues on its current plan
    if (mode === "cancel_pending") {
      const subscription = await stripe.subscriptions.retrieve(sub.stripe_subscription_id as string);
      const scheduleId = (subscription as any).schedule as string | null;
      if (scheduleId) {
        try {
          await stripe.subscriptionSchedules.release(scheduleId);
        } catch (e) {
          console.error("release schedule failed", e);
        }
      }
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (sub.price_id === newPriceLookupKey) {
      return new Response(JSON.stringify({ error: "Already on this plan" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Resolve new price id from lookup key
    const prices = await stripe.prices.list({
      lookup_keys: [newPriceLookupKey],
    });
    if (!prices.data.length) throw new Error("New price not found");
    const newPrice = prices.data[0];

    // Fetch current subscription
    const subscription = await stripe.subscriptions.retrieve(
      sub.stripe_subscription_id as string,
    );
    const currentItem = subscription.items.data[0];
    if (!currentItem) throw new Error("Subscription has no items");

    // Block a second pending change while one is already scheduled.
    if (mode === "confirm") {
      const existingPending = await readPending(subscription);
      if (existingPending) {
        return new Response(
          JSON.stringify({ error: "A plan change is already scheduled. Cancel it before scheduling another." }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // Determine renewal date (period end of current item)
    const periodEnd: number | null =
      (currentItem as any).current_period_end ??
      (subscription as any).current_period_end ??
      null;

    if (mode === "preview") {
      return new Response(
        JSON.stringify({
          scheduledFor: periodEnd,
          currentPriceId: currentItem.price.id,
          newPriceId: newPrice.id,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Confirm: schedule the plan change at the next renewal (no proration / no refund).
    // Use a Stripe subscription schedule with two phases:
    //   phase 1: current price until period end
    //   phase 2: new price, renews normally
    let scheduleId = (subscription as any).schedule as string | null;

    if (!scheduleId) {
      const created = await (stripe.subscriptionSchedules as any).create({
        from_subscription: sub.stripe_subscription_id,
      });
      scheduleId = created.id;
    }

    const existing = await stripe.subscriptionSchedules.retrieve(scheduleId!);
    const firstPhase = existing.phases[0];
    if (!firstPhase) throw new Error("Schedule has no phases");

    await stripe.subscriptionSchedules.update(scheduleId!, {
      end_behavior: "release",
      proration_behavior: "none",
      phases: [
        {
          items: firstPhase.items.map((it: any) => ({
            price: it.price,
            quantity: it.quantity ?? 1,
          })),
          start_date: firstPhase.start_date as any,
          end_date: firstPhase.end_date as any,
        },
        {
          items: [{ price: newPrice.id, quantity: 1 }],
        },
      ],
      metadata: {
        ...(existing.metadata || {}),
        userId: user.id,
        pending_plan_change: newPriceLookupKey,
      },
    });

    // NOTE: Do NOT update the memberships table yet — the webhook will sync
    // plan_type / max_pets when the new phase activates at renewal.

    return new Response(
      JSON.stringify({
        success: true,
        scheduledFor: periodEnd,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
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
