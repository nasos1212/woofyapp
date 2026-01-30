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
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // SECURITY: Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Authentication required" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create a client with the user's auth token to verify identity
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(
        JSON.stringify({ success: false, error: "Invalid session" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create admin client for privileged operations
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // SECURITY: Verify the user has admin role
    const { data: isAdmin, error: roleError } = await supabaseAdmin
      .rpc("has_role", { _user_id: user.id, _role: "admin" });

    if (roleError) {
      console.error("Role check error:", roleError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to verify admin status" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!isAdmin) {
      console.warn(`Unauthorized delete attempt by user: ${user.id}`);
      return new Response(
        JSON.stringify({ success: false, error: "Admin access required" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // SECURITY: Require confirmation token for extra safety
    const body = await req.json().catch(() => ({}));
    const { includeAdmins, confirmationToken } = body;

    if (confirmationToken !== "CONFIRM_DELETE_ALL_USERS") {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Confirmation token required. Pass confirmationToken: 'CONFIRM_DELETE_ALL_USERS' to proceed." 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Log this dangerous operation
    console.log(`CRITICAL: Delete all users initiated by admin: ${user.id} (${user.email})`);

    // List all users
    const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      throw listError;
    }

    const users = usersData.users || [];
    const deletedEmails: string[] = [];
    const errors: string[] = [];

    // Get admin user IDs if we need to skip them
    let adminUserIds = new Set<string>();
    if (!includeAdmins) {
      const { data: adminRoles } = await supabaseAdmin
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");
      adminUserIds = new Set((adminRoles || []).map((r) => r.user_id));
    }

    // Delete users
    for (const targetUser of users) {
      if (!includeAdmins && adminUserIds.has(targetUser.id)) {
        console.log(`Skipping admin user: ${targetUser.email}`);
        continue;
      }

      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUser.id);

      if (deleteError) {
        errors.push(`Failed to delete ${targetUser.email}: ${deleteError.message}`);
      } else {
        deletedEmails.push(targetUser.email || targetUser.id);
      }
    }

    console.log(`Delete operation completed by admin ${user.email}. Deleted: ${deletedEmails.length}, Errors: ${errors.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        deleted: deletedEmails.length,
        deletedEmails,
        errors,
        skippedAdmins: adminUserIds.size,
        initiatedBy: user.email,
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
