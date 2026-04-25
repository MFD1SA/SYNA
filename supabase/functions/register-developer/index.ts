import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit, clientIpFromRequest, rateLimited } from "../_shared/rate-limit.ts";

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

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Commission agreement text (v2.0 — 13 articles, 2.50% + 1.50% = 4.00%)
const AGREEMENT_TEXT_AR = `اتفاقية الخدمات والأتعاب المهنية — سينا للتطوير العقاري (v2.0)

التمهيد
بناءً على رغبة الطرفين في تنظيم علاقتهما المهنية، وتحديد حقوقهما والتزاماتهما بما لا يتعارض مع الأنظمة المعمول بها في المملكة العربية السعودية، ولا سيّما نظام الوساطة العقارية ولوائحه التنفيذية الصادرة عن الهيئة العامة للعقار (REGA)، وأنظمة حماية المعلومات والخصوصية ونظام مكافحة التستّر التجاري ونظام مكافحة غسل الأموال، فقد تم إبرام هذه الاتفاقية بإرادة الطرفين وكامل أهليتهما المعتبرة شرعاً ونظاماً.

المادة الأولى: أطراف الاتفاقية
أُبرمت هذه الاتفاقية بين:
الطرف الأول: سينا للتطوير العقاري — مقدّم الخدمات ومشغّل المنصة.
الطرف الثاني: المطور العقاري المسجّل في المنصة.

المادة الثانية: التعريفات
«المنصة»: منصة سينا الرقمية وما يتبعها من خدمات وساطة عقارية وتسهيل للشراكات والصفقات.
«الصفقة»: أي اتفاق أو عقد ينشأ بين الطرف الثاني وأيّ طرف ثالث (مالك أرض أو مستثمر) بناءً على خدمة قدّمتها المنصة أو معلومة أُتيحت من خلالها.
«قيمة الأرض»: السعر الإجمالي المتفق عليه للأرض في الصفقة، ولا يشمل قيمة التطوير أو البناء.
«المعلومات السرية»: كل بيان أو مستند أو معلومة يُطّلع عليها الطرف الثاني من خلال المنصة.

المادة الثالثة: نطاق الاتفاقية
تسري هذه الاتفاقية على كل صفقة أو شراكة أو تعامل ينشأ بين الطرف الثاني وأيّ مالك أرض أو طرف ثالث تعرّف إليه أو حصل على بياناته — بشكل مباشر أو غير مباشر — من خلال المنصة، وتستمر سارية طوال فترة استخدام المنصة وبعد ذلك لمدة (24) شهراً من آخر تفاعل.

المادة الرابعة: هيكل الأتعاب المهنية
1. عمولة السعي العقاري: 2.50% من قيمة الأرض، مستحقة للوسيط العقاري وفقاً لنظام الوساطة العقارية.
2. أتعاب المنصة: 1.50% من قيمة الأرض، مقابل الخدمات التشغيلية والتقنية والاستشارية التي تقدمها المنصة.
3. إجمالي الأتعاب المهنية: 4.00% من قيمة الأرض.
تُحتسب النسب المذكورة على قيمة الأرض فقط ولا تشمل قيمة التطوير أو التشييد.

المادة الخامسة: آلية الدفع واستحقاق الأتعاب
1. تستحق الأتعاب فور اكتمال التعاقد النهائي بين المطور ومالك الأرض (سواء كان عقد بيع، أو شراكة، أو تطوير، أو أي صيغة تعاقدية مماثلة).
2. يتم الاتفاق على آلية السداد الفعلية مباشرة بين المالك والمطوّر، على أن تُسدَّد حصة المنصة (4.00%) إلى سينا للتطوير العقاري خلال مدة أقصاها (30) يوماً من تاريخ توقيع العقد النهائي.
3. يُعتبر التأخر في السداد خرقاً لهذه الاتفاقية ويترتب عليه فوائد تأخير بحدّ أقصى لا يُخالف الأنظمة السارية، فضلاً عن حق المنصة في اتخاذ الإجراءات القانونية.

المادة السادسة: التزامات الطرف الثاني (المطور)
1. حسن النية والشفافية: يلتزم المطوّر بالتصرّف بحسن نية وإفصاح كامل في جميع تعاملاته عبر المنصة.
2. حظر التحايل: يُحظر على المطوّر إبرام أي صفقة — بشكل مباشر أو عبر طرف ثالث مرتبط به — مع أيّ مالك أو طرف تعرّف إليه من خلال المنصة دون إشعار سينا وسداد الأتعاب المستحقة. ويُعدّ أي تحايل على هذا الالتزام إخلالاً جسيماً يستوجب التعويض الكامل.
3. السرية: يلتزم المطوّر بالحفاظ على سرية جميع المعلومات التي اطّلع عليها عبر المنصة، وعدم إفشائها أو استخدامها لأيّ غرض خارج نطاق الصفقة.
4. عدم المنافسة غير المشروعة: يُحظر على المطور استخدام بيانات الملاك أو المعلومات السرية لأيّ نشاط موازٍ أو منافس خلال مدة الاتفاقية وبعد انتهائها لمدة (24) شهراً.
5. دقة البيانات: يتحمّل المطوّر كامل المسؤولية عن صحة وكمال البيانات التي يقدمها عند التسجيل واستخدام المنصة.

المادة السابعة: ضمانات المنصة وحدود المسؤولية
1. تقدّم المنصة خدماتها ببذل العناية المهنية المعتادة، ولا تضمن نتيجة أيّ صفقة أو جدوى أيّ استثمار.
2. لا تُعدّ المعلومات المعروضة على المنصة تقييمات عقارية رسمية ولا مشورة استثمارية.
3. يتم التعامل مع المعلومات الشخصية وفقاً لنظام حماية البيانات الشخصية في المملكة العربية السعودية.

المادة الثامنة: السرية وحماية البيانات
1. تُعدّ جميع المعلومات المتبادلة بين الطرفين سرية تامة ومحمية بموجب هذه الاتفاقية والأنظمة المعمول بها.
2. يلتزم الطرف الثاني بعدم نسخ أو تصوير أو مشاركة أي مستند أو معلومة مع أيّ طرف ثالث دون موافقة كتابية من سينا.
3. يستمر التزام السرية لمدة (5) خمس سنوات من تاريخ انتهاء هذه الاتفاقية.

المادة التاسعة: الإخلال والجزاءات
1. يُعدّ كل مما يلي إخلالاً جوهرياً بالاتفاقية: التحايل على الأتعاب، إفشاء المعلومات السرية، تقديم بيانات كاذبة، أو التواصل المباشر مع المالك لتجاوز المنصة.
2. في حال الإخلال، يحق للمنصة: (أ) المطالبة بكامل الأتعاب المستحقة مضاعفةً كتعويض اتفاقي، (ب) تعليق أو إلغاء حساب المطور، (ج) اتخاذ جميع الإجراءات القانونية والنظامية المتاحة.
3. لا تُخلّ الجزاءات المذكورة بحق المنصة في المطالبة بالأضرار الفعلية والتبعية الإضافية.

المادة العاشرة: المدة والإنهاء
1. تسري هذه الاتفاقية من تاريخ الموافقة عليها إلكترونياً وتظل سارية طوال فترة استخدام المنصة.
2. يحق لأيّ طرف إنهاء الاتفاقية بإشعار كتابي مسبق مدته (30) يوماً، مع بقاء الالتزامات المتعلقة بالسرية والأتعاب المستحقة سارية المفعول بعد الإنهاء.
3. لا يترتب على الإنهاء إسقاط أيّ حقوق نشأت قبله.

المادة الحادية عشرة: القانون الواجب التطبيق وتسوية النزاعات
1. تخضع هذه الاتفاقية لأنظمة المملكة العربية السعودية وتُفسَّر وفقاً لها.
2. يسعى الطرفان لتسوية أيّ نزاع ودياً، وفي حال تعذّر ذلك يُحال النزاع إلى الجهة القضائية المختصة في مدينة الرياض.

المادة الثانية عشرة: أحكام عامة
1. الإشعارات: تُرسل عبر البريد الإلكتروني المسجّل لكلا الطرفين وتُعدّ نافذة من تاريخ الإرسال.
2. الموافقة الإلكترونية: توقيع الطرف الثاني إلكترونياً على هذه الاتفاقية له ذات الأثر القانوني للتوقيع الكتابي، وفقاً لنظام التعاملات الإلكترونية السعودي.
3. استقلالية البنود: بطلان أيّ بند لا يؤثر على باقي البنود.
4. الاتفاقية الكاملة: تمثّل هذه الاتفاقية مع ملاحقها كامل التفاهم بين الطرفين، وتلغي ما قبلها من اتفاقيات شفهية أو كتابية.

المادة الثالثة عشرة: الإقرار والقبول
بالموافقة الإلكترونية على هذه الاتفاقية، يُقرّ الطرف الثاني بأنه قرأ جميع بنود هذه الاتفاقية وفهم محتواها، وأنه يوافق عليها بالكامل وبإرادته الحرة والمنفردة، دون إكراه أو تضليل، وأنه مخوَّل نظاماً بتوقيعها نيابة عن الطرف الثاني.`;

const AGREEMENT_TEXT_EN = `Professional Services & Fees Agreement — SINA Real Estate Development (v2.0)

Preamble
Based on the mutual desire of both parties to regulate their professional relationship and define their rights and obligations in accordance with the applicable laws of the Kingdom of Saudi Arabia — including the Real Estate Brokerage Law and its Implementing Regulations issued by the General Real Estate Authority (REGA), the Personal Data Protection Law, the Anti-Concealment Law, and the Anti-Money Laundering Law — this Agreement is entered into by the free and legally valid consent of both parties.

Article 1: Parties
This Agreement is executed between:
First Party: SINA Real Estate Development — the Service Provider and platform operator.
Second Party: The Real Estate Developer registered on the platform.

Article 2: Definitions
"Platform": The SINA digital platform and all related brokerage and partnership-facilitation services.
"Transaction": Any agreement or contract entered into between the Second Party and any third party (landowner or investor) based on a service or information made available through the Platform.
"Land Value": The total agreed price of the land, excluding development or construction value.
"Confidential Information": Any data, document, or information accessed by the Second Party through the Platform.

Article 3: Scope
This Agreement applies to every transaction, partnership, or dealing arising between the Second Party and any landowner or third party identified — directly or indirectly — through the Platform, and remains effective throughout the use of the Platform and for twenty-four (24) months following the last interaction.

Article 4: Professional Fees Structure
1. Real Estate Brokerage Fee: 2.50% of the Land Value, due under the Real Estate Brokerage Law.
2. Platform Services Fee: 1.50% of the Land Value, for operational, technical, and advisory services.
3. Total Professional Fees: 4.00% of the Land Value.
All percentages are calculated on the Land Value only and exclude development or construction value.

Article 5: Payment Mechanism & Accrual
1. Fees become due upon the conclusion of the final contract between the Developer and the landowner (whether sale, partnership, development, or equivalent arrangement).
2. The actual payment mechanism is agreed directly between the owner and the Developer, provided the Platform's share (4.00%) is remitted to SINA Real Estate Development within a maximum of thirty (30) days from signature of the final contract.
3. Late payment constitutes a breach and may incur late-payment interest up to the legally permitted maximum, without prejudice to the Platform's right to take legal action.

Article 6: Developer's Obligations
1. Good Faith & Transparency: The Developer shall act in good faith and with full disclosure in all Platform dealings.
2. Circumvention Prohibited: The Developer is prohibited from concluding any transaction — directly or through any related third party — with any owner or party identified through the Platform without notifying SINA and paying the due fees. Any circumvention is a material breach requiring full indemnification.
3. Confidentiality: The Developer shall maintain the confidentiality of all Platform-sourced information and not disclose or use it outside the scope of the transaction.
4. Non-Compete: The Developer shall not use owner data or Confidential Information in any parallel or competing activity during the Agreement and for twenty-four (24) months thereafter.
5. Data Accuracy: The Developer bears full responsibility for the accuracy and completeness of all data provided.

Article 7: Platform Warranties & Liability Limits
1. The Platform provides services with customary professional care and does not warrant the outcome of any transaction or the feasibility of any investment.
2. Information presented on the Platform does not constitute official property valuations or investment advice.
3. Personal data is handled in accordance with the Saudi Personal Data Protection Law.

Article 8: Confidentiality & Data Protection
1. All information exchanged is strictly confidential and protected under this Agreement and applicable law.
2. The Second Party shall not copy, photograph, or share any document or information with any third party without SINA's written consent.
3. Confidentiality obligations survive for five (5) years after the termination of this Agreement.

Article 9: Breach & Remedies
1. Any of the following constitutes a material breach: circumventing fees, disclosing confidential information, providing false data, or directly contacting the owner to bypass the Platform.
2. In case of breach, the Platform is entitled to: (a) claim the full due fees doubled as agreed-upon liquidated damages; (b) suspend or terminate the Developer's account; (c) pursue all available legal remedies.
3. The foregoing remedies are without prejudice to the Platform's right to claim additional actual and consequential damages.

Article 10: Term & Termination
1. This Agreement takes effect upon electronic acceptance and remains effective throughout the use of the Platform.
2. Either party may terminate the Agreement by thirty (30) days' prior written notice, provided that confidentiality and due-fee obligations survive such termination.
3. Termination does not waive any rights accrued prior thereto.

Article 11: Governing Law & Dispute Resolution
1. This Agreement is governed by and construed in accordance with the laws of the Kingdom of Saudi Arabia.
2. The parties shall seek to settle any dispute amicably; failing which the dispute shall be referred to the competent judicial authority in the city of Riyadh.

Article 12: General Provisions
1. Notices: Sent via the parties' registered email and deemed effective as of the date of dispatch.
2. Electronic Consent: The Second Party's electronic signature has the same legal effect as a handwritten signature, pursuant to the Saudi Electronic Transactions Law.
3. Severability: Invalidity of any clause does not affect the remaining clauses.
4. Entire Agreement: This Agreement, together with its annexes, constitutes the entire understanding of the parties and supersedes all prior oral or written agreements.

Article 13: Acknowledgment & Acceptance
By electronically accepting this Agreement, the Second Party acknowledges having read and understood all terms, and accepts them in full voluntarily, without coercion or misrepresentation, being legally authorized to execute this Agreement on behalf of the Second Party.`;

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
  const clientIp = clientIpFromRequest(req);
  const userAgent = req.headers.get("user-agent") || "unknown";

  // Rate limit BEFORE parsing body — reject floods cheaply.
  //   - IP: 3 developer registrations / hour per IP (prevents scripted signup floods)
  const rlClient = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const ipGate = await checkRateLimit(rlClient, {
    key: `register-developer:ip:${clientIp}`,
    windowSeconds: 3600,
    maxHits: 3,
  });
  if (!ipGate.allowed) return rateLimited(corsHeaders, 3600);

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
    const logo_url = typeof payload.logo_url === "string" ? payload.logo_url.trim() : "";
    const commission_accepted = payload.commission_accepted === true;

    // Validation
    if (!emailRegex.test(email) || !password || !company_name || !contact_person_name) {
      throw new Error("Missing or invalid required fields");
    }

    if (password.length < 10 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
      throw new Error("Password must be at least 10 chars and include uppercase, lowercase, number, and symbol");
    }

    // Require corporate email — reject free personal webmail domains (all known variants)
    const FREE_EMAIL_DOMAINS = new Set([
      // Google
      "gmail.com", "googlemail.com",
      // Yahoo
      "yahoo.com", "yahoo.co.uk", "yahoo.fr", "yahoo.de", "yahoo.es", "yahoo.it",
      "yahoo.ca", "yahoo.com.au", "yahoo.in", "yahoo.co.jp", "ymail.com", "rocketmail.com",
      // Microsoft
      "hotmail.com", "hotmail.co.uk", "hotmail.fr", "hotmail.de", "hotmail.es", "hotmail.it",
      "outlook.com", "outlook.sa", "outlook.fr", "outlook.de", "outlook.es", "outlook.it",
      "outlook.co.uk", "outlook.com.au",
      "live.com", "live.co.uk", "live.fr", "live.de", "live.ca", "live.com.au",
      "msn.com",
      // Apple
      "icloud.com", "me.com", "mac.com",
      // Other free providers
      "aol.com", "aim.com",
      "protonmail.com", "proton.me", "pm.me",
      "mail.com", "email.com",
      "gmx.com", "gmx.net", "gmx.de", "gmx.at", "gmx.ch",
      "zoho.com", "zohomail.com",
      "yandex.com", "yandex.ru",
      "qq.com", "163.com", "126.com",
      "rediffmail.com", "inbox.com", "tutanota.com", "tuta.io",
      "fastmail.com", "fastmail.fm",
      "hey.com",
    ]);
    const emailDomain = email.split("@")[1] || "";
    if (FREE_EMAIL_DOMAINS.has(emailDomain)) {
      throw new Error("A corporate email is required — personal email domains are not accepted");
    }

    if (!commission_accepted) {
      throw new Error("Commission agreement must be accepted");
    }

    const adminClient = createClient(supabaseUrl, serviceKey);

    // Step 1: Create auth user (email already confirmed — no verification email needed)
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
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
      logo_url: logo_url || null,
    }).select("id").single();

    if (devError) {
      await adminClient.auth.admin.deleteUser(userId);
      // 23505 = unique_violation; surfaces if a parallel request
      // somehow raced past the auth uniqueness check (e.g. admin
      // already pre-created a developer row for this user_id).
      // The `developers_user_id_uniq` constraint closes that hole;
      // we translate the error so the user sees something actionable.
      if ((devError as any).code === "23505") {
        throw new Error("This email is already registered");
      }
      throw new Error("Failed to create developer profile");
    }

    // Step 3: Save commission agreement v2.0 (server-side IP — reliable)
    const { error: agreementError } = await adminClient.from("developer_agreements").insert({
      user_id: userId,
      developer_id: devData.id,
      agreement_type: "commission_agreement",
      agreement_version: "v2.0",
      agreement_text_ar: AGREEMENT_TEXT_AR,
      agreement_text_en: AGREEMENT_TEXT_EN,
      commission_brokerage: 2.50,
      commission_operational: 1.50,
      commission_total: 4.00,
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
      { user_id: userId, policy_type: "commission_agreement", policy_version: "v2.0" },
    ]);

    // Step 6: Notify admin (email already confirmed — no verification link needed)
    await adminClient.from("notifications").insert({
      user_id: userId,
      type: "new_developer_registered",
      title_ar: `مطور جديد: ${company_name}`,
      title_en: `New Developer: ${company_name}`,
      message_ar: `تم تسجيل المطور ${contact_person_name} من شركة ${company_name} ووافق على اتفاقية العمولة (4%)`,
      message_en: `Developer ${contact_person_name} from ${company_name} registered and accepted the commission agreement (4%)`,
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
      "A corporate email is required",
    ];
    const message = safeMessages.some(m => err.message?.includes(m)) ? err.message : "Registration failed";
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
