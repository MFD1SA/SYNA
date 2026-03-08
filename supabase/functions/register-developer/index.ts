import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { email, password, company_name, cr_number, cr_file_url, marketing_brand_name, phone, website } = await req.json();

    if (!email || !password || !company_name || !cr_number || !cr_file_url) {
      throw new Error("Missing required fields");
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
        full_name: company_name,
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
      cr_number,
      cr_file_url,
      marketing_brand_name: marketing_brand_name || null,
      email,
      phone: phone || null,
      website: website || null,
    });
    if (devError) {
      console.error("[register-developer] Failed to create developer record:", devError);
      // Cleanup: delete the auth user since developer record failed
      await adminClient.auth.admin.deleteUser(userId);
      throw new Error("Failed to create developer profile");
    }

    // Update profile with phone
    if (phone) {
      await adminClient.from("profiles").update({ phone }).eq("user_id", userId);
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
