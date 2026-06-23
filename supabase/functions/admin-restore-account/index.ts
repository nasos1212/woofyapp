import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claims?.claims?.sub) return json({ error: "Unauthorized" }, 401);
    const callerId = claims.claims.sub as string;

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Verify caller is an admin
    const { data: callerRoles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId);
    const isAdmin = (callerRoles ?? []).some((r) => r.role === "admin");
    if (!isAdmin) return json({ error: "Forbidden" }, 403);

    const body = await req.json().catch(() => ({}));
    const targetUserId = body?.user_id as string | undefined;
    if (!targetUserId) return json({ error: "user_id is required" }, 400);

    const { data: profile } = await admin
      .from("profiles")
      .select("deletion_scheduled_for, email, full_name")
      .eq("user_id", targetUserId)
      .maybeSingle();

    if (!profile) return json({ error: "Profile not found" }, 404);
    if (!profile.deletion_scheduled_for) {
      return json({ error: "Account is not pending deletion." }, 400);
    }
    if (new Date(profile.deletion_scheduled_for) < new Date()) {
      return json(
        { error: "Grace period has expired; account has already been purged or is being purged." },
        410,
      );
    }

    const { error: updateError } = await admin
      .from("profiles")
      .update({ deletion_requested_at: null, deletion_scheduled_for: null })
      .eq("user_id", targetUserId);

    if (updateError) throw updateError;

    console.log(
      `Admin ${callerId} restored account ${targetUserId} (${profile.email})`,
    );

    return json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("admin-restore-account error:", message);
    return json({ error: message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
