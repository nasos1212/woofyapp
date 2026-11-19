import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";
import { loadCoverageSelection, coverageMetadata } from "../_shared/petCoverage.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function resolveOrCreateCustomer(
  stripe: ReturnType<typeof createStripeClient>,
  options: { email?: string; userId?: string },
): Promise<string> {
  if (options.userId && !/^[a-zA-Z0-9_-]+$/.test(options.userId)) {
    throw new Error("Invalid userId");
  }
  if (options.userId) {
    const found = await stripe.customers.search({
      query: `metadata['userId']:'${options.userId}'`,
      limit: 1,
    });
    if (found.data.length) return found.data[0].id;
  }
  const created = await stripe.customers.create({
    ...(options.email && { email: options.email }),
    ...(options.userId && { metadata: { userId: options.userId } }),
  });
  return created.id;
}

async function createCheckoutSession(options: {
  priceId: string;
  quantity?: number;
  customerEmail?: string;
  userId?: string;
  returnUrl: string;
  environment: StripeEnv;
  coveredPetIds: string[];
}) {
  if (!/^[a-zA-Z0-9_-]+$/.test(options.priceId)) throw new Error("Invalid priceId");
  const stripe = createStripeClient(options.environment);

  const prices = await stripe.prices.list({ lookup_keys: [options.priceId] });
  if (!prices.data.length) throw new Error("Price not found");
  const stripePrice = prices.data[0];
  const isRecurring = stripePrice.type === "recurring";

  const customerId =
    options.customerEmail || options.userId
      ? await resolveOrCreateCustomer(stripe, {
          email: options.customerEmail,
          userId: options.userId,
        })
      : undefined;

  let productDescription: string | undefined;
  if (!isRecurring) {
    const productId =
      typeof stripePrice.product === "string"
        ? stripePrice.product
        : stripePrice.product.id;
    const product = await stripe.products.retrieve(productId);
    productDescription = product.name;
  }

  const session = await stripe.checkout.sessions.create({
    line_items: [{ price: stripePrice.id, quantity: 1 }],
    mode: isRecurring ? "subscription" : "payment",
    ui_mode: "embedded_page",
    return_url: options.returnUrl,
    ...(customerId && { customer: customerId }),
    ...(!isRecurring && {
      payment_intent_data: { description: productDescription },
    }),
    ...(options.userId && {
      metadata: { userId: options.userId },
      ...(isRecurring && {
        subscription_data: { metadata: { userId: options.userId, ...coverageMetadata(options.coveredPetIds, options.priceId) } },
      }),
    }),
  } as any);

  return session.client_secret;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    const backendUrl = Deno.env.get("SUPABASE_URL");
    const backendKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!backendUrl || !backendKey) throw new Error("Payments are unavailable. Please try again later.");
    const sb = createClient(backendUrl, backendKey, { global: { headers: { Authorization: authHeader } } });
    const { data: authData } = token ? await sb.auth.getUser(token) : { data: { user: null } };
    const authUser = authData?.user;
    if (!authUser) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const body = await req.json();
    const environment: StripeEnv =
      body.environment === "live" ? "live" : "sandbox";
    const coveredPetIds = await loadCoverageSelection(sb, authUser.id, body.coveredPetIds, body.priceId, true);
    const clientSecret = await createCheckoutSession({
      coveredPetIds,
      priceId: body.priceId,
      quantity: 1,
      customerEmail: authUser.email ?? undefined,
      userId: authUser.id,
      returnUrl: body.returnUrl,
      environment,
    });
    return new Response(JSON.stringify({ clientSecret }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("create-checkout error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
