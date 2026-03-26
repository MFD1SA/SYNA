import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
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

const drivePattern = /^https:\/\/(drive|docs)\.google\.com\//;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
    const payload = await req.json();

    const email = String(payload.email || "").trim().toLowerCase();
    const password = String(payload.password || "");
    const company_name = String(payload.company_name || "").trim();
    const contact_person_name = String(payload.contact_person_name || "").trim();
    const cr_number = String(payload.cr_number || "").trim();
    const cr_file_url = String(payload.cr_file_url || "").trim();
    const company_profile_url = String(payload.company_profile_url || "").trim();
    const phone = String(payload.phone || "").trim();
    const city = String(payload.city || "").trim();
    const website = String(payload.website || "").trim();
    const project_types = Array.isArray(payload.project_types) ? payload.project_types : [];
    const target_cities = Array.isArray(payload.target_cities) ? payload.target_cities : [];

    if (!emailRegex.test(email) || !password || !company_name || !cr_number || !cr_file_url) {
      throw new Error("Missing or invalid required fields");
    }

    if (password.length < 10) {
      throw new Error("Password must be at least 10 characters");
    }

    if (!drivePattern.test(cr_file_url)) {
      throw new Error("Invalid Google Drive link for CR document");
    }

    if (company_profile_url && !drivePattern.test(company_profile_url)) {
      throw new Error("Invalid Google Drive link for company profile");
    }

    const adminClient = createClient(supabaseUrl, serviceKey);

    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: {
        full_name: contact_person_name || company_name,
        subscription_type: "individual",
        account_type: "developer",
        phone,
      },
    });

    if (createError || !newUser.user) {
      throw new Error("Unable to create account");
    }

    const userId = newUser.user.id;

    const { error: devError } = await adminClient.from("developers").insert({
      user_id: userId,
      company_name,
      contact_person_name: contact_person_name || null,
      cr_number,
      cr_file_url,
      company_profile_url: company_profile_url || null,
      email,
      phone: phone || null,
      city: city || null,
      website: website || null,
      project_types,
      target_cities,
    });

    if (devError) {
      await adminClient.auth.admin.deleteUser(userId);
      throw new Error("Failed to create developer profile");
    }

    if (phone || contact_person_name) {
      const profileUpdate: Record<string, string> = {};
      if (phone) profileUpdate.phone = phone;
      if (contact_person_name) profileUpdate.full_name = contact_person_name;
      await adminClient.from("profiles").update(profileUpdate).eq("user_id", userId);
    }

    await adminClient.from("policy_consents").insert([
      { user_id: userId, policy_type: "terms", policy_version: "1.0.0" },
      { user_id: userId, policy_type: "privacy", policy_version: "1.0.0" },
      { user_id: userId, policy_type: "usage", policy_version: "1.0.0" },
    ]);

    const { error: emailError } = await adminClient.auth.admin.generateLink({
      type: "signup",
      email,
      options: { redirectTo: resolveSafeOrigin(req.headers.get("origin")) },
    });

    if (emailError) {
      console.error("[register-developer] Email link error:", emailError);
    }

    return new Response(JSON.stringify({ success: true, user_id: userId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[register-developer] Error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
