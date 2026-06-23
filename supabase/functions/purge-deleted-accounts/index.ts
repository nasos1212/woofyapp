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
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const nowIso = new Date().toISOString();
    const { data: due, error } = await admin
      .from("profiles")
      .select("user_id, email")
      .not("deletion_scheduled_for", "is", null)
      .lte("deletion_scheduled_for", nowIso);

    if (error) throw error;

    const results: Array<{ user_id: string; deleted: boolean; error?: string }> = [];

    for (const row of due ?? []) {
      try {
        const { error: delErr } = await admin.auth.admin.deleteUser(row.user_id);
        if (delErr) throw delErr;
        results.push({ user_id: row.user_id, deleted: true });
        console.log(`Purged account ${row.user_id} (${row.email})`);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unknown error";
        results.push({ user_id: row.user_id, deleted: false, error: msg });
        console.error(`Failed to purge ${row.user_id}:`, msg);
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed: results.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("purge-deleted-accounts error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
