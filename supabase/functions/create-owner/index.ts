import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
const publicSiteUrl = Deno.env.get("PUBLIC_SITE_URL") ?? "https://cidoma.com";
const allowedRootDomain = (Deno.env.get("ALLOWED_ROOT_DOMAIN") ?? "cidoma.com").toLowerCase();

const isAllowedOrigin = (origin: string | null) => {
  if (!origin) return false;
  try {
    const url = new URL(origin);
    const hostname = url.hostname.toLowerCase();
    return hostname === allowedRootDomain || hostname.endsWith(`.${allowedRootDomain}`);
  } catch {
    return false;
  }
};

const resolveSafeOrigin = (origin: string | null) => {
  if (isAllowedOrigin(origin)) return origin!;
  return publicSiteUrl;
};

const buildCorsHeaders = (origin: string | null) => ({
  "Access-Control-Allow-Origin": resolveSafeOrigin(origin),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  Vary: "Origin",
});

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isStrongPassword = (value: string) =>
  value.length >= 10 && /[A-Z]/.test(value) && /[a-z]/.test(value) && /\d/.test(value) && /[^A-Za-z0-9]/.test(value);

const findAuthUserByEmail = async (adminClient: ReturnType<typeof createClient>, email: string) => {
  const normalized = email.trim().toLowerCase();
  let page = 1;
  const perPage = 200;

  while (page <= 10) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const found = data.users.find((u) => (u.email || "").toLowerCase() === normalized);
    if (found) return found;

    if (data.users.length < perPage) break;
    page += 1;
  }

  return null;
};

const ensureAdminRole = async (adminClient: ReturnType<typeof createClient>, userId: string, email: string, displayName: string) => {
  const { data: existingRole } = await adminClient
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();

  if (!existingRole) {
    const { error: roleError } = await adminClient.from("user_roles").insert({ user_id: userId, role: "admin" });
    if (roleError) throw roleError;
  }

  const { data: existingPerm } = await adminClient
    .from("admin_permissions")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!existingPerm) {
    const { error: permError } = await adminClient.from("admin_permissions").insert({
      user_id: userId,
      user_email: email,
      display_name: displayName,
      is_super_admin: true,
      perm_developers: true,
      perm_lands: true,
      perm_owners: true,
      perm_deals: true,
      perm_content: true,
      perm_ai: true,
      perm_audit_log: true,
    });
    if (permError) throw permError;
  }
};

const getPrimaryAdminEmail = async (adminClient: ReturnType<typeof createClient>) => {
  const { data } = await adminClient
    .from("platform_content")
    .select("id, body_en")
    .eq("content_key", "primary_admin_config")
    .maybeSingle();

  if (!data?.body_en) return null;

  try {
    const parsed = JSON.parse(data.body_en);
    const email = String(parsed?.primary_admin_email || "").trim().toLowerCase();
    return emailRegex.test(email) ? email : null;
  } catch {
    return null;
  }
};

const setPrimaryAdminEmail = async (adminClient: ReturnType<typeof createClient>, email: string, updatedBy: string) => {
  const normalizedEmail = email.trim().toLowerCase();
  const payload = {
    content_key: "primary_admin_config",
    content_type: "config",
    title_en: "Primary Admin Config",
    title_ar: "إعدادات المسؤول الرئيسي",
    body_en: JSON.stringify({ primary_admin_email: normalizedEmail }),
    body_ar: JSON.stringify({ primary_admin_email: normalizedEmail }),
    updated_by: updatedBy,
  };

  const { data: existing } = await adminClient
    .from("platform_content")
    .select("id")
    .eq("content_key", "primary_admin_config")
    .maybeSingle();

  if (existing?.id) {
    const { error } = await adminClient.from("platform_content").update(payload).eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await adminClient.from("platform_content").insert(payload);
    if (error) throw error;
  }
};

const writeAuditLog = async (
  adminClient: ReturnType<typeof createClient>,
  actorId: string,
  actorEmail: string | null,
  action: string,
  entityType: string,
  entityId: string,
  details?: Record<string, unknown>,
) => {
  await adminClient.from("audit_logs").insert({
    user_id: actorId,
    user_email: actorEmail,
    action,
    entity_type: entityType,
    entity_id: entityId,
    details: details || {},
  });
};

Deno.serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { action } = body;

    const adminClient = createClient(supabaseUrl, serviceKey);

    if (action === "bootstrap_first_admin" || action === "bootstrap_admin_recovery") {
      const bootstrapSecret = Deno.env.get("BOOTSTRAP_ADMIN_SECRET") || "";
      const providedSecret = req.headers.get("x-bootstrap-secret") || body.bootstrap_secret || "";

      if (!bootstrapSecret || providedSecret !== bootstrapSecret) {
        throw new Error("Invalid bootstrap secret");
      }

      if (action === "bootstrap_first_admin") {
        const { data: existingAdmin } = await adminClient
          .from("user_roles")
          .select("user_id")
          .eq("role", "admin")
          .limit(1)
          .maybeSingle();

        if (existingAdmin?.user_id) {
          throw new Error("Bootstrap disabled: admin already exists");
        }
      }

      const email = String(body.email || "").trim().toLowerCase();
      const password = String(body.password || "");
      const displayName = String(body.display_name || "Primary Admin").trim();

      if (!emailRegex.test(email)) throw new Error("Valid email required");
      if (!isStrongPassword(password)) throw new Error("Password must be at least 10 chars and include upper/lowercase letters, number, and symbol");

      const existingUser = await findAuthUserByEmail(adminClient, email);
      let userId = existingUser?.id;

      if (existingUser) {
        const { error: updateError } = await adminClient.auth.admin.updateUserById(existingUser.id, {
          password,
          email_confirm: true,
          user_metadata: { ...(existingUser.user_metadata || {}), full_name: displayName },
        });
        if (updateError) throw updateError;
      } else {
        const { data: createdUser, error: createError } = await adminClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: displayName },
        });
        if (createError || !createdUser.user) throw new Error(createError?.message ?? "Unable to bootstrap admin");
        userId = createdUser.user.id;
      }

      if (!userId) throw new Error("Unable to resolve admin user");

      await ensureAdminRole(adminClient, userId, email, displayName);

      return new Response(JSON.stringify({ success: true, user_id: userId, email, mode: action }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing auth");

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await userClient.auth.getUser();
    if (!caller) throw new Error("Unauthorized");

    // Caller must be on the admin staff. The "admin staff" rolling-up
    // covers BOTH the legacy 'admin' role (super admins / first-class
    // admins) AND the newer 'supervisor' / 'specialist' roles introduced
    // with the high-control gallery work — anyone with a row in
    // admin_permissions counts. The fine-grained `perm_*` flags then
    // gate which specific actions each caller can perform; the
    // `is_super_admin` flag still gates the most destructive ones.
    const { data: roleRows } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id);
    const callerRoles = (roleRows ?? []).map((r) => r.role as string);
    const hasAdminRole = callerRoles.includes("admin");
    const hasStaffRole =
      hasAdminRole ||
      callerRoles.includes("supervisor") ||
      callerRoles.includes("specialist");

    const { data: permData } = await adminClient
      .from("admin_permissions")
      .select(
        "is_super_admin, perm_developers, perm_owners, perm_lands, perm_deals, perm_content, perm_ai, perm_audit_log",
      )
      .eq("user_id", caller.id)
      .maybeSingle();
    const isSuperAdmin = !!permData?.is_super_admin;
    const perms = (permData ?? {}) as Record<string, boolean | null>;
    const hasPerm = (col: string) => isSuperAdmin || !!perms[col];

    // Reject anyone who is NOT on the admin staff. We allow callers who
    // have a staff role *or* an admin_permissions row (defensive — the
    // permissions row alone is enough to identify a staff member even if
    // their user_roles entry was misseated during the supervisor enum
    // migration).
    if (!hasStaffRole && !permData) {
      throw new Error("Not admin");
    }

    if (action === "get_primary_admin_config") {
      if (!isSuperAdmin) throw new Error("Super admin access required");
      const configuredEmail = await getPrimaryAdminEmail(adminClient);
      return new Response(JSON.stringify({ primary_admin_email: configuredEmail || null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "update_primary_admin_email") {
      if (!isSuperAdmin) throw new Error("Super admin access required");
      const newEmail = String(body.email || "").trim().toLowerCase();
      if (!emailRegex.test(newEmail)) throw new Error("Valid email required");

      const previousEmail = await getPrimaryAdminEmail(adminClient);
      const existingPrimaryAdminUser = previousEmail
        ? await findAuthUserByEmail(adminClient, previousEmail)
        : await findAuthUserByEmail(adminClient, newEmail);

      if (existingPrimaryAdminUser && (existingPrimaryAdminUser.email || "").toLowerCase() !== newEmail) {
        const { error: updateAuthEmailError } = await adminClient.auth.admin.updateUserById(existingPrimaryAdminUser.id, {
          email: newEmail,
          email_confirm: true,
        });
        if (updateAuthEmailError) throw updateAuthEmailError;
      }

      await setPrimaryAdminEmail(adminClient, newEmail, caller.id);
      await writeAuditLog(adminClient, caller.id, caller.email || null, "update_primary_admin_email", "primary_admin", "config", {
        previous_email: previousEmail,
        new_email: newEmail,
        auth_user_updated: !!existingPrimaryAdminUser,
      });

      return new Response(JSON.stringify({ success: true, primary_admin_email: newEmail }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "reset_primary_admin_password" || action === "trigger_primary_admin_recovery") {
      if (!isSuperAdmin) throw new Error("Super admin access required");
      const newPassword = String(body.new_password || "");
      const displayName = String(body.display_name || "Primary Admin").trim();
      if (!isStrongPassword(newPassword)) throw new Error("Password must be at least 10 chars and include upper/lowercase letters, number, and symbol");

      const primaryAdminEmail = await getPrimaryAdminEmail(adminClient);
      if (!primaryAdminEmail) throw new Error("Primary admin email is not configured");

      const existingUser = await findAuthUserByEmail(adminClient, primaryAdminEmail);
      let userId = existingUser?.id;

      if (existingUser) {
        const { error: updateError } = await adminClient.auth.admin.updateUserById(existingUser.id, {
          password: newPassword,
          email_confirm: true,
          user_metadata: { ...(existingUser.user_metadata || {}), full_name: displayName },
        });
        if (updateError) throw updateError;
      } else {
        if (action !== "trigger_primary_admin_recovery") {
          throw new Error("Primary admin user does not exist");
        }
        const { data: createdUser, error: createError } = await adminClient.auth.admin.createUser({
          email: primaryAdminEmail,
          password: newPassword,
          email_confirm: true,
          user_metadata: { full_name: displayName },
        });
        if (createError || !createdUser.user) throw new Error(createError?.message ?? "Unable to create primary admin");
        userId = createdUser.user.id;
      }

      if (!userId) throw new Error("Unable to resolve primary admin user");
      await ensureAdminRole(adminClient, userId, primaryAdminEmail, displayName);

      const auditAction = action === "trigger_primary_admin_recovery" ? "trigger_primary_admin_recovery" : "reset_primary_admin_password";
      await writeAuditLog(adminClient, caller.id, caller.email || null, auditAction, "primary_admin", userId, {
        primary_admin_email: primaryAdminEmail,
      });

      return new Response(JSON.stringify({ success: true, user_id: userId, primary_admin_email: primaryAdminEmail }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "update_password") {
      // Resetting an end-user's password is gated by the relevant
      // domain permission. The caller specifies which entity they're
      // operating on via `target_kind`; we accept any of:
      //   - "developer"  → perm_developers
      //   - "owner"      → perm_owners
      //   - "supervisor" → super-admin only (resetting another staff
      //                    account's password is a privileged operation
      //                    and must NOT be possible from a perm_*
      //                    delegation alone)
      // Falling back to perm_developers covers the historical AdminDevelopers
      // call site that did not send `target_kind` (we want the existing
      // panel to keep working without a coordinated frontend ship).
      const { user_id, new_password, target_kind } = body;
      if (!user_id || !new_password) throw new Error("user_id and new_password required");
      if (!isStrongPassword(new_password)) throw new Error("Password must be at least 10 chars and include upper/lowercase letters, number, and symbol");
      if (user_id === caller.id) throw new Error("Cannot change your own password from this endpoint");

      // Super-admin gate for supervisor resets — domain permissions are
      // not sufficient since a perm_developers grant should NOT confer
      // the ability to override a peer's credentials.
      if (target_kind === "supervisor") {
        if (!callerPerms?.is_super_admin) {
          throw new Error("Insufficient permissions");
        }
        // Defensive check: target must actually be a staff/admin row,
        // not an owner or developer being mislabeled.
        const { data: targetRoles } = await adminClient
          .from("user_roles")
          .select("role")
          .eq("user_id", user_id);
        const isAdminTarget = (targetRoles || []).some((r: any) => r.role === "admin");
        if (!isAdminTarget) {
          throw new Error("Target is not a staff/admin account");
        }
      } else {
        const requiredPerm =
          target_kind === "owner"
            ? "perm_owners"
            : target_kind === "developer"
              ? "perm_developers"
              : "perm_developers";
        if (!hasPerm(requiredPerm)) {
          throw new Error("Insufficient permissions");
        }
      }

      const { error } = await adminClient.auth.admin.updateUserById(user_id, { password: new_password });
      if (error) throw error;

      // Audit so a super admin can later see which staff member changed
      // which user's password.
      const auditEntityType =
        target_kind === "supervisor" ? "supervisor" :
        target_kind === "owner" ? "owner" : "developer";
      await writeAuditLog(
        adminClient,
        caller.id,
        caller.email || null,
        "admin_update_password",
        auditEntityType,
        user_id,
        { target_kind: target_kind || "developer" },
      );

      return new Response(JSON.stringify({ success: true, updated_user_id: user_id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete_user") {
      // Same model: deleting an auth user is permitted when the caller
      // has the matching domain perm for the entity being deleted. The
      // AdminDevelopers cascade-delete flow lands here after the DB
      // cascade has already succeeded; if we reject the auth-delete the
      // developer row is already gone, so the orphan is benign and we
      // log a warning at the call site rather than rolling back.
      // Supervisor deletions require super-admin (a perm_developers
      // delegation must NOT be enough to delete a peer).
      const { user_id, target_kind } = body;
      if (!user_id) throw new Error("user_id required");
      if (user_id === caller.id) throw new Error("Cannot delete your own account from this endpoint");

      if (target_kind === "supervisor") {
        if (!callerPerms?.is_super_admin) {
          throw new Error("Insufficient permissions");
        }
        const { data: targetRoles } = await adminClient
          .from("user_roles")
          .select("role")
          .eq("user_id", user_id);
        const isAdminTarget = (targetRoles || []).some((r: any) => r.role === "admin");
        if (!isAdminTarget) {
          throw new Error("Target is not a staff/admin account");
        }
      } else {
        const requiredPerm =
          target_kind === "owner"
            ? "perm_owners"
            : target_kind === "developer"
              ? "perm_developers"
              : "perm_developers";
        if (!hasPerm(requiredPerm)) {
          throw new Error("Insufficient permissions");
        }
      }

      const { error } = await adminClient.auth.admin.deleteUser(user_id);
      if (error) throw error;

      const auditEntityType =
        target_kind === "supervisor" ? "supervisor" :
        target_kind === "owner" ? "owner" : "developer";
      await writeAuditLog(
        adminClient,
        caller.id,
        caller.email || null,
        "admin_delete_auth_user",
        auditEntityType,
        user_id,
        { target_kind: target_kind || "developer" },
      );

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "create_supervisor") {
      if (!isSuperAdmin) throw new Error("Super admin access required");
      const email = String(body.email || "").trim().toLowerCase();
      const password = String(body.password || "");
      const display_name = String(body.display_name || "").trim();
      const permissions = body.permissions || {};

      if (!emailRegex.test(email)) throw new Error("Valid email required");
      if (!isStrongPassword(password)) throw new Error("Password must be at least 10 chars and include upper/lowercase letters, number, and symbol");

      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: display_name },
      });
      if (createError || !newUser.user) throw new Error(createError?.message ?? "Unable to create supervisor");

      const userId = newUser.user.id;

      // SECURITY: A previous version inserted `role: "admin"` here, which
      // meant every "supervisor" passed `has_role(auth.uid(),'admin')` on
      // RLS policies guarding contact_submissions, email_log, developers,
      // audit_logs, etc. That silently bypassed the fine-grained
      // admin_permissions flags and effectively gave every supervisor
      // full admin data access.
      //
      // The `supervisor` role was added to the app_role enum in
      // 20260418200000_phase1_gallery_high_control.sql specifically so
      // we could store supervisors with a distinct role. RLS policies
      // should gate off admin_permissions.is_super_admin / perm_* flags
      // rather than raw has_role('admin').
      const { error: roleError } = await adminClient
        .from("user_roles")
        .insert({ user_id: userId, role: "supervisor" });
      if (roleError) {
        await adminClient.auth.admin.deleteUser(userId);
        throw roleError;
      }

      const { error: permissionsError } = await adminClient.from("admin_permissions").insert({
        user_id: userId,
        user_email: email,
        display_name,
        is_super_admin: false,
        perm_developers: !!permissions.perm_developers,
        perm_lands: !!permissions.perm_lands,
        perm_owners: !!permissions.perm_owners,
        perm_deals: !!permissions.perm_deals,
        perm_content: !!permissions.perm_content,
        perm_ai: !!permissions.perm_ai,
        perm_audit_log: !!permissions.perm_audit_log,
      });

      if (permissionsError) {
        await adminClient.from("user_roles").delete().eq("user_id", userId).eq("role", "admin");
        await adminClient.auth.admin.deleteUser(userId);
        throw permissionsError;
      }

      return new Response(JSON.stringify({ success: true, user_id: userId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const full_name = String(body.full_name || "").trim();

    if (!emailRegex.test(email)) throw new Error("Valid email required");
    if (!isStrongPassword(password)) throw new Error("Password must be at least 10 chars and include upper/lowercase letters, number, and symbol");

    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    });
    if (createError || !newUser.user) throw new Error(createError?.message ?? "Unable to create owner");

    const { error: roleInsertError } = await adminClient.from("user_roles").insert({ user_id: newUser.user.id, role: "owner" });
    if (roleInsertError) {
      await adminClient.auth.admin.deleteUser(newUser.user.id);
      throw roleInsertError;
    }

    return new Response(JSON.stringify({ user_id: newUser.user.id, email: newUser.user.email }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("create-owner error:", err.message);
    const safeMessages = [
      "Missing authorization", "Unauthorized", "Not admin", "Super admin access required",
      "Insufficient permissions",
      "user_id and new_password required", "Cannot change your own password from this endpoint",
      "Password must be at least 10 chars and include upper/lowercase letters, number, and symbol",
      "user_id required", "target_user_id required", "User not found",
      "Cannot impersonate your own account", "Admin impersonation is not allowed",
      "Valid email required", "Unable to create supervisor",
    ];
    const message = safeMessages.some(m => err.message?.includes(m)) ? err.message : "Operation failed";
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
