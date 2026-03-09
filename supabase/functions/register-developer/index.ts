import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const {
      email, password, company_name, contact_person_name, cr_number,
      cr_file_url, company_profile_url, phone, city, website,
      project_types, target_cities,
    } = await req.json();

    if (!email || !password || !company_name || !cr_number || !cr_file_url) {
      throw new Error("Missing required fields");
    }

    // Validate Google Drive links
    const drivePattern = /^https:\/\/(drive|docs)\.google\.com\//;
    if (!drivePattern.test(cr_file_url)) {
      throw new Error("Invalid Google Drive link for CR document");
    }
    if (company_profile_url && !drivePattern.test(company_profile_url)) {
      throw new Error("Invalid Google Drive link for company profile");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceKey);

    // Check if email already exists
    const { data: existingUsers } = await adminClient.auth.admin.listUsers();
    const emailExists = existingUsers?.users?.some(u => u.email === email);
    if (emailExists) {
      throw new Error("Email already registered");
    }

    // Create auth user (NOT auto-confirmed — developer must verify email)
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: {
        full_name: contact_person_name || company_name,
        subscription_type: "individual",
        account_type: "developer",
        phone: phone || "",
      },
    });
    if (createError) throw createError;

    const userId = newUser.user.id;

    // handle_new_user trigger creates profile + assigns 'user' role automatically
    // Now create developer record using service role (bypasses RLS)
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
      project_types: project_types || [],
      target_cities: target_cities || [],
    });
    if (devError) {
      console.error("[register-developer] Failed to create developer record:", devError);
      // Cleanup: delete the auth user since developer record failed
      await adminClient.auth.admin.deleteUser(userId);
      throw new Error("Failed to create developer profile");
    }

    // Update profile with phone and contact person name
    if (phone || contact_person_name) {
      const profileUpdate: Record<string, string> = {};
      if (phone) profileUpdate.phone = phone;
      if (contact_person_name) profileUpdate.full_name = contact_person_name;
      await adminClient.from("profiles").update(profileUpdate).eq("user_id", userId);
    }

    // Insert policy consents
    await adminClient.from("policy_consents").insert([
      { user_id: userId, policy_type: "terms", policy_version: "1.0.0" },
      { user_id: userId, policy_type: "privacy", policy_version: "1.0.0" },
      { user_id: userId, policy_type: "usage", policy_version: "1.0.0" },
    ]);

    // Send confirmation email
    const { error: emailError } = await adminClient.auth.admin.generateLink({
      type: "signup",
      email,
      options: { redirectTo: `${req.headers.get("origin") || supabaseUrl}` },
    });
    if (emailError) {
      console.error("[register-developer] Email link error:", emailError);
    }

    console.log(`[register-developer] Developer registered: ${email} (${userId})`);

    return new Response(
      JSON.stringify({ success: true, user_id: userId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[register-developer] Error:", err.message);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
