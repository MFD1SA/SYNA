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
    return hostname === allowedRootDomain || hostname.endsWith(`.${allowedRootDomain}`) || hostname === "localhost";
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

// Commission agreement text (v1.0)
const AGREEMENT_TEXT_AR = `اتفاقية عمولة منصة سينا للتطوير العقاري

المادة الأولى: أطراف الاتفاقية
هذه الاتفاقية مبرمة بين منصة سينا للتطوير العقاري (المشغّل) والمطور العقاري (الطرف الثاني) المسجّل في المنصة

المادة الثانية: نطاق الاتفاقية
تسري هذه الاتفاقية على جميع الصفقات والشراكات العقارية التي تتم عبر المنصة وتشمل صفقات الأراضي والتطوير العقاري بجميع أنواعها

المادة الثالثة: هيكل العمولة
1. عمولة الوساطة العقارية: 2.50% من القيمة الإجمالية للصفقة
2. أتعاب المنصة التشغيلية: 0.50% من القيمة الإجمالية للصفقة
3. إجمالي حصة المنصة: 3.00% من القيمة الإجمالية للصفقة

المادة الرابعة: نطاق العمولة
تشمل العمولة المذكورة أعلاه كامل قيمة الصفقة بما في ذلك قيمة الأرض وقيمة التطوير العقاري

المادة الخامسة: التزامات المطور
1. يلتزم المطور بسداد كامل حصة المنصة عند إتمام الصفقة
2. يلتزم المطور بعدم التواصل المباشر مع مالك الأرض خارج المنصة بهدف تجاوز العمولة
3. يلتزم المطور بالحفاظ على سرية المعلومات المتاحة عبر المنصة
4. يلتزم المطور بعدم استخدام المعلومات المقدمة عبر المنصة لأي غرض خارج نطاق الصفقة

المادة السادسة: السرية وحفظ الحقوق
1. جميع المعلومات المتبادلة عبر المنصة سرية ومحمية
2. يحق للمنصة اتخاذ الإجراءات القانونية في حال مخالفة شروط السرية أو تجاوز المنصة
3. تحتفظ المنصة بحق تعليق أو إلغاء حساب المطور في حال المخالفة

المادة السابعة: مدة الاتفاقية
تسري هذه الاتفاقية من تاريخ الموافقة عليها وتظل سارية طوال فترة استخدام المطور للمنصة

المادة الثامنة: القبول والموافقة
بالموافقة على هذه الاتفاقية يقر المطور بأنه قرأ وفهم جميع البنود المذكورة أعلاه ويوافق عليها بالكامل وبإرادته الحرة`;

const AGREEMENT_TEXT_EN = `SINA Real Estate Development Platform Commission Agreement

Article 1: Parties
This agreement is entered into between SINA Real Estate Development Platform (the Operator) and the Real Estate Developer (Second Party) registered on the platform

Article 2: Scope
This agreement applies to all real estate transactions and partnerships conducted through the platform including land deals and real estate development of all types

Article 3: Commission Structure
1. Real Estate Brokerage Commission: 2.50% of the total transaction value
2. Platform Operational Fee: 0.50% of the total transaction value
3. Total Platform Share: 3.00% of the total transaction value

Article 4: Commission Coverage
The above commission covers the entire transaction value including land value and real estate development value

Article 5: Developer Obligations
1. The developer commits to paying the full platform share upon deal completion
2. The developer shall not contact the land owner directly outside the platform to bypass the commission
3. The developer shall maintain confidentiality of information available through the platform
4. The developer shall not use information provided through the platform for any purpose outside the scope of the transaction

Article 6: Confidentiality and Rights Protection
1. All information exchanged through the platform is confidential and protected
2. The platform reserves the right to take legal action in case of breach of confidentiality or platform bypass
3. The platform reserves the right to suspend or cancel the developer account in case of violation

Article 7: Duration
This agreement is effective from the date of acceptance and remains in force throughout the developer use of the platform

Article 8: Acceptance
By accepting this agreement the developer acknowledges having read and understood all the above terms and agrees to them fully and voluntarily`;

Deno.serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Capture IP from request headers (server-side — reliable)
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("cf-connecting-ip")
    || req.headers.get("x-real-ip")
    || "unknown";
  const userAgent = req.headers.get("user-agent") || "unknown";

  try {
    const payload = await req.json();

    const email = String(payload.email || "").trim().toLowerCase();
    const password = String(payload.password || "");
    const company_name = String(payload.company_name || "").trim();
    const contact_person_name = String(payload.contact_person_name || "").trim();
    const phone = String(payload.phone || "").trim();
    const city = String(payload.city || "").trim();
    const website = String(payload.website || "").trim();
    const company_description = String(payload.company_description || "").trim();
    const commission_accepted = payload.commission_accepted === true;

    // Validation
    if (!emailRegex.test(email) || !password || !company_name || !contact_person_name) {
      throw new Error("Missing or invalid required fields");
    }

    if (password.length < 10 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
      throw new Error("Password must be at least 10 chars and include uppercase, lowercase, number, and symbol");
    }

    if (!commission_accepted) {
      throw new Error("Commission agreement must be accepted");
    }

    const adminClient = createClient(supabaseUrl, serviceKey);

    // Step 1: Create auth user
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
      const msg = createError?.message || "";
      if (msg.includes("already")) throw new Error("This email is already registered");
      throw new Error("Unable to create account");
    }

    const userId = newUser.user.id;

    // Step 2: Create developer record
    const { data: devData, error: devError } = await adminClient.from("developers").insert({
      user_id: userId,
      company_name,
      contact_person_name: contact_person_name || null,
      email,
      phone: phone || null,
      city: city || null,
      website: website || null,
    }).select("id").single();

    if (devError) {
      await adminClient.auth.admin.deleteUser(userId);
      throw new Error("Failed to create developer profile");
    }

    // Step 3: Save commission agreement (server-side IP — reliable)
    const { error: agreementError } = await adminClient.from("developer_agreements").insert({
      user_id: userId,
      developer_id: devData.id,
      agreement_type: "commission_agreement",
      agreement_version: "v1.0",
      agreement_text_ar: AGREEMENT_TEXT_AR,
      agreement_text_en: AGREEMENT_TEXT_EN,
      commission_brokerage: 2.50,
      commission_operational: 0.50,
      commission_total: 3.00,
      accepted: true,
      accepted_at: new Date().toISOString(),
      ip_address: clientIp,
      user_agent: userAgent,
    });

    if (agreementError) {
      // Rollback: delete developer + user if agreement fails
      await adminClient.from("developers").delete().eq("id", devData.id);
      await adminClient.auth.admin.deleteUser(userId);
      throw new Error("Failed to save commission agreement");
    }

    // Step 4: Update profile
    if (phone || contact_person_name) {
      const profileUpdate: Record<string, string> = {};
      if (phone) profileUpdate.phone = phone;
      if (contact_person_name) profileUpdate.full_name = contact_person_name;
      await adminClient.from("profiles").update(profileUpdate).eq("user_id", userId);
    }

    // Step 5: Policy consents
    await adminClient.from("policy_consents").insert([
      { user_id: userId, policy_type: "terms", policy_version: "1.0.0" },
      { user_id: userId, policy_type: "privacy", policy_version: "1.0.0" },
      { user_id: userId, policy_type: "usage", policy_version: "1.0.0" },
      { user_id: userId, policy_type: "commission_agreement", policy_version: "v1.0" },
    ]);

    // Step 6: Send verification email
    const { error: emailError } = await adminClient.auth.admin.generateLink({
      type: "signup",
      email,
      options: { redirectTo: resolveSafeOrigin(req.headers.get("origin")) },
    });

    if (emailError) {
      console.error("[register-developer] Email link error:", emailError);
    }

    // Step 7: Notify admin
    await adminClient.from("notifications").insert({
      user_id: userId,
      type: "new_developer_registered",
      title_ar: `مطور جديد: ${company_name}`,
      title_en: `New Developer: ${company_name}`,
      message_ar: `تم تسجيل المطور ${contact_person_name} من شركة ${company_name} ووافق على اتفاقية العمولة (3%)`,
      message_en: `Developer ${contact_person_name} from ${company_name} registered and accepted the commission agreement (3%)`,
      entity_type: "developer",
      entity_id: devData.id,
    }).then(() => {}).catch(() => {});

    return new Response(JSON.stringify({ success: true, user_id: userId, developer_id: devData.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[register-developer] Error:", err.message);
    const safeMessages = [
      "Missing or invalid required fields",
      "Password must be at least 10 chars",
      "Commission agreement must be accepted",
      "This email is already registered",
      "Failed to create developer profile",
      "Failed to save commission agreement",
    ];
    const message = safeMessages.some(m => err.message?.includes(m)) ? err.message : "Registration failed";
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
