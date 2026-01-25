import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Get all admin user IDs first
    const { data: adminRoles } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    const adminUserIds = new Set((adminRoles || []).map((r) => r.user_id));

    // List all users
    const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      throw listError;
    }

    const users = usersData.users || [];
    const deletedEmails: string[] = [];
    const errors: string[] = [];

    // Delete each non-admin user
    for (const user of users) {
      if (adminUserIds.has(user.id)) {
        console.log(`Skipping admin user: ${user.email}`);
        continue;
      }

      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

      if (deleteError) {
        errors.push(`Failed to delete ${user.email}: ${deleteError.message}`);
      } else {
        deletedEmails.push(user.email || user.id);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        deleted: deletedEmails.length,
        deletedEmails,
        errors,
        skippedAdmins: adminUserIds.size,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
