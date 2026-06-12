import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, verifyWebhook } from "../_shared/stripe.ts";

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
  }
  return _supabase;
}

// Maps Stripe price lookup_keys → existing memberships.plan_type / max_pets
const PRICE_TO_PLAN: Record<string, { plan_type: string; max_pets: number }> = {
  wooffy_solo_yearly: { plan_type: "single", max_pets: 1 },
  wooffy_duo_yearly: { plan_type: "duo", max_pets: 2 },
  wooffy_pack_yearly: { plan_type: "family", max_pets: 5 },
};

async function syncMembership(
  userId: string,
  priceId: string | undefined,
  status: string,
  periodEnd: string | null,
  cancelAtPeriodEnd: boolean,
) {
  if (!priceId) return;
  const mapping = PRICE_TO_PLAN[priceId];
  if (!mapping) {
    console.warn("Unknown price_id for membership sync:", priceId);
    return;
  }

  // Active access: active/trialing/past_due (Stripe still retrying)
  // OR canceled with grace period until period_end.
  const hasAccess =
    ["active", "trialing", "past_due"].includes(status) ||
    (status === "canceled" && periodEnd && new Date(periodEnd) > new Date());

  const updates: Record<string, unknown> = {
    is_active: !!hasAccess,
  };
  if (hasAccess) {
    updates.plan_type = mapping.plan_type;
    updates.max_pets = mapping.max_pets;
    if (periodEnd) updates.expires_at = periodEnd;
  } else {
    // Subscription fully canceled / unpaid → revert to free tier
    updates.plan_type = "free";
    updates.max_pets = 5;
  }

  const { error } = await getSupabase()
    .from("memberships")
    .update(updates)
    .eq("user_id", userId);

  if (error) {
    console.error("Failed to sync membership for user", userId, error);
  }
}

async function upsertSubscription(subscription: any, env: StripeEnv) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error("No userId in subscription metadata", subscription.id);
    return;
  }

  const item = subscription.items?.data?.[0];
  const priceId =
    item?.price?.lookup_key ||
    item?.price?.metadata?.lovable_external_id ||
    item?.price?.id;
  const productId = item?.price?.product;
  const periodStart =
    item?.current_period_start ?? subscription.current_period_start;
  const periodEnd =
    item?.current_period_end ?? subscription.current_period_end;
  const periodEndIso = periodEnd ? new Date(periodEnd * 1000).toISOString() : null;

  await getSupabase().from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer,
      product_id: productId,
      price_id: priceId,
      status: subscription.status,
      current_period_start: periodStart
        ? new Date(periodStart * 1000).toISOString()
        : null,
      current_period_end: periodEndIso,
      cancel_at_period_end: subscription.cancel_at_period_end || false,
      environment: env,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "stripe_subscription_id" },
  );

  await syncMembership(
    userId,
    priceId,
    subscription.status,
    periodEndIso,
    subscription.cancel_at_period_end || false,
  );
}

async function handleSubscriptionDeleted(subscription: any, env: StripeEnv) {
  await getSupabase()
    .from("subscriptions")
    .update({ status: "canceled", updated_at: new Date().toISOString() })
    .eq("stripe_subscription_id", subscription.id)
    .eq("environment", env);

  const userId = subscription.metadata?.userId;
  if (userId) {
    await syncMembership(userId, undefined, "canceled", null, false);
    // Force revert (syncMembership returns early without priceId, do it inline)
    await getSupabase()
      .from("memberships")
      .update({ is_active: false, plan_type: "free", max_pets: 5 })
      .eq("user_id", userId);
  }
}

async function handleWebhook(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env);
  console.log("Stripe webhook event:", event.type, "(env:", env, ")");

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
      await upsertSubscription(event.data.object, env);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object, env);
      break;
    default:
      console.log("Unhandled event:", event.type);
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  const rawEnv = new URL(req.url).searchParams.get("env");
  if (rawEnv !== "sandbox" && rawEnv !== "live") {
    console.error("Webhook received with invalid env:", rawEnv);
    return new Response(JSON.stringify({ received: true, ignored: "invalid env" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
  try {
    await handleWebhook(req, rawEnv);
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Webhook error:", e);
    return new Response("Webhook error", { status: 400 });
  }
});
