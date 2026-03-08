import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing auth");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller is admin
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await userClient.auth.getUser();
    if (!caller) throw new Error("Unauthorized");

    const adminClient = createClient(supabaseUrl, serviceKey);

    // Check admin role
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) throw new Error("Not admin");

    const body = await req.json();
    const { action } = body;

    // UPDATE PASSWORD
    if (action === "update_password") {
      const { user_id, new_password } = body;
      if (!user_id || !new_password) throw new Error("user_id and new_password required");
      if (new_password.length < 6) throw new Error("Password must be at least 6 characters");
      if (user_id === caller.id) throw new Error("Cannot change your own password from this endpoint");

      console.log(`[create-owner] Admin ${caller.email} changing password for user_id: ${user_id}`);

      const { error } = await adminClient.auth.admin.updateUserById(user_id, {
        password: new_password,
      });
      if (error) throw error;

      console.log(`[create-owner] Password updated successfully for user_id: ${user_id}`);

      return new Response(
        JSON.stringify({ success: true, updated_user_id: user_id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // DELETE USER
    if (action === "delete_user") {
      const { user_id } = body;
      if (!user_id) throw new Error("user_id required");

      const { error } = await adminClient.auth.admin.deleteUser(user_id);
      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // CREATE SUPERVISOR
    if (action === "create_supervisor") {
      const { email, password, display_name, permissions } = body;
      if (!email || !password) throw new Error("Email and password required");

      // Create auth user
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: display_name || "" },
      });
      if (createError) throw createError;

      // Assign admin role
      await adminClient.from("user_roles").insert({ user_id: newUser.user.id, role: "admin" });

      // Create permissions record
      await adminClient.from("admin_permissions").insert({
        user_id: newUser.user.id,
        user_email: email,
        display_name: display_name || "",
        is_super_admin: false,
        perm_developers: permissions?.perm_developers || false,
        perm_lands: permissions?.perm_lands || false,
        perm_owners: permissions?.perm_owners || false,
        perm_deals: permissions?.perm_deals || false,
        perm_content: permissions?.perm_content || false,
        perm_ai: permissions?.perm_ai || false,
        perm_audit_log: permissions?.perm_audit_log || false,
      });

      return new Response(
        JSON.stringify({ success: true, user_id: newUser.user.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // CREATE USER (default action)
    const { email, password, full_name } = body;
    if (!email || !password) throw new Error("Email and password required");

    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: full_name || "" },
    });

    if (createError) throw createError;

    // Assign 'owner' role so the user can be detected as owner
    await adminClient.from("user_roles").insert({ user_id: newUser.user.id, role: "owner" });

    return new Response(
      JSON.stringify({ user_id: newUser.user.id, email: newUser.user.email }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
