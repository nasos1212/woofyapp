// Shared request authorization helpers for edge functions.
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? "";

export function serviceClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
}

function bearer(req: Request): string | null {
  const h = req.headers.get("Authorization") ?? req.headers.get("authorization");
  if (!h || !h.toLowerCase().startsWith("bearer ")) return null;
  return h.slice(7).trim() || null;
}

/** Returns the signed-in user's id from the request JWT, or null. */
export async function getUserId(req: Request): Promise<string | null> {
  const token = bearer(req);
  if (!token || token === SERVICE_KEY) return null;
  const client = createClient(SUPABASE_URL, ANON_KEY || SERVICE_KEY, { auth: { persistSession: false } });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user.id;
}

export async function isAdmin(userId: string): Promise<boolean> {
  const { data } = await serviceClient().rpc("has_role", { _user_id: userId, _role: "admin" });
  return data === true;
}

/** True for server-to-server calls: service key bearer or the internal cron secret. */
export async function isInternal(req: Request): Promise<boolean> {
  if (bearer(req) === SERVICE_KEY) return true;
  const secret = req.headers.get("x-internal-secret");
  if (!secret) return false;
  const { data } = await serviceClient().from("app_secrets").select("value").eq("key", "cron_secret").maybeSingle();
  return !!data?.value && data.value === secret;
}

/** Allows internal calls or signed-in admins. */
export async function isInternalOrAdmin(req: Request): Promise<boolean> {
  if (await isInternal(req)) return true;
  const uid = await getUserId(req);
  return !!uid && (await isAdmin(uid));
}

export function forbidden(corsHeaders: Record<string, string>, status = 403): Response {
  return new Response(JSON.stringify({ error: status === 401 ? "Unauthorized" : "Forbidden" }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
