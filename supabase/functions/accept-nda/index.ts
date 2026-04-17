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

// NDA Text v1.0
const NDA_TEXT_AR = `اتفاقية عدم الإفصاح — منصة سينا للتطوير العقاري

المادة الأولى: أطراف الاتفاقية
هذه الاتفاقية مبرمة بين منصة سينا للتطوير العقاري (المشغّل) والمطور العقاري (الطرف الثاني) المسجّل في المنصة، وتتعلق بالفرصة العقارية المحددة أدناه.

المادة الثانية: نطاق السرية
يلتزم المطور بالحفاظ على سرية كافة المعلومات المتعلقة بالفرصة العقارية المحددة، بما في ذلك على سبيل المثال لا الحصر:
1. بيانات الأرض والموقع والمساحة والمخططات
2. الدراسات والتقارير الفنية والمالية المقدمة عبر المنصة
3. هوية مالك الأرض وبيانات التواصل معه (عند الكشف عنها)
4. شروط الشراكة والتفاوض والأسعار
5. أي معلومات أخرى يتم تبادلها عبر المنصة بخصوص هذه الفرصة

المادة الثالثة: التزامات المطور
1. عدم إفشاء أي معلومات سرية لأي طرف ثالث دون موافقة خطية مسبقة من المنصة
2. عدم استخدام المعلومات السرية لأي غرض خارج نطاق تقييم الفرصة العقارية والتقدم لها
3. عدم التواصل المباشر مع مالك الأرض خارج المنصة بهدف تجاوز المنصة أو عمولتها
4. اتخاذ التدابير المعقولة لحماية المعلومات السرية من الوصول غير المصرح به
5. إبلاغ المنصة فوراً في حال حدوث أي اختراق أو إفشاء غير مقصود

المادة الرابعة: مدة السرية
تسري التزامات السرية من تاريخ قبول هذه الاتفاقية وتستمر لمدة ثلاث (3) سنوات بعد انتهاء العلاقة التعاقدية أو إغلاق الفرصة العقارية، أيهما لاحق.

المادة الخامسة: الاستثناءات
لا تشمل التزامات السرية المعلومات التي:
1. أصبحت متاحة للعموم دون خطأ من المطور
2. كانت بحوزة المطور قبل تلقيها عبر المنصة مع إثبات ذلك
3. تم الحصول عليها من مصدر مستقل دون انتهاك لالتزامات السرية

المادة السادسة: الجزاءات
في حال مخالفة أحكام هذه الاتفاقية:
1. يحق للمنصة تعليق أو إلغاء حساب المطور فوراً
2. يحق للمنصة المطالبة بالتعويض عن أي أضرار ناتجة عن الإخلال
3. يحق للمنصة اتخاذ كافة الإجراءات القانونية المتاحة

المادة السابعة: القبول
بالموافقة على هذه الاتفاقية يقر المطور بأنه قرأ وفهم جميع البنود أعلاه ويوافق عليها بالكامل وبإرادته الحرة، ويدرك أن رفض هذه الاتفاقية يمنعه من التقدم لهذه الفرصة العقارية المحددة.`;

const NDA_TEXT_EN = `Non-Disclosure Agreement — SINA Real Estate Development Platform

Article 1: Parties
This agreement is entered into between SINA Real Estate Development Platform (the Operator) and the Real Estate Developer (Second Party) registered on the platform, in relation to the specific real estate opportunity identified below.

Article 2: Scope of Confidentiality
The developer commits to maintaining the confidentiality of all information related to the specified real estate opportunity, including but not limited to:
1. Land data, location, area, and plans
2. Technical and financial studies and reports provided through the platform
3. The identity and contact details of the land owner (when disclosed)
4. Partnership terms, negotiation details, and pricing
5. Any other information exchanged through the platform regarding this opportunity

Article 3: Developer Obligations
1. Not to disclose any confidential information to any third party without prior written consent from the platform
2. Not to use confidential information for any purpose outside the scope of evaluating and applying for the real estate opportunity
3. Not to contact the land owner directly outside the platform to bypass the platform or its commission
4. To take reasonable measures to protect confidential information from unauthorized access
5. To immediately notify the platform in case of any breach or unintended disclosure

Article 4: Duration of Confidentiality
Confidentiality obligations are effective from the date of acceptance of this agreement and continue for three (3) years after the end of the contractual relationship or the closure of the real estate opportunity, whichever is later.

Article 5: Exceptions
Confidentiality obligations do not cover information that:
1. Has become publicly available without fault of the developer
2. Was in the developer's possession prior to receiving it through the platform, with proof thereof
3. Was obtained from an independent source without breach of confidentiality obligations

Article 6: Penalties
In case of violation of this agreement:
1. The platform reserves the right to immediately suspend or cancel the developer's account
2. The platform reserves the right to claim compensation for any damages resulting from the breach
3. The platform reserves the right to take all available legal actions

Article 7: Acceptance
By accepting this agreement, the developer acknowledges having read and understood all the above terms and agrees to them fully and voluntarily, and understands that rejecting this agreement prevents them from applying for this specific real estate opportunity.`;

Deno.serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("cf-connecting-ip")
    || req.headers.get("x-real-ip")
    || "unknown";
  const userAgent = req.headers.get("user-agent") || "unknown";

  try {
    // Verify auth token
    const authHeader = req.headers.get("authorization");
    if (!authHeader) throw new Error("Unauthorized");

    const adminClient = createClient(supabaseUrl, serviceKey);
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const payload = await req.json();
    const landId = String(payload.land_id || "").trim();
    const action = String(payload.action || "").trim(); // "accept" or "reject"
    const actorRole = String(payload.actor_role || "developer").trim(); // "developer" or "owner"

    if (!landId) throw new Error("land_id is required");
    if (!["accept", "reject"].includes(action)) throw new Error("action must be 'accept' or 'reject'");
    if (!["developer", "owner"].includes(actorRole)) throw new Error("actor_role must be 'developer' or 'owner'");

    // Role-specific verification
    if (actorRole === "developer") {
      const { data: dev } = await adminClient
        .from("developers")
        .select("id, verification_status")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!dev) throw new Error("Developer profile not found");
      if (dev.verification_status !== "verified") throw new Error("Developer must be verified");
    } else {
      // Owner: verify they own this land
      const { data: ownerLand } = await adminClient
        .from("lands")
        .select("id")
        .eq("id", landId)
        .eq("owner_id", user.id)
        .maybeSingle();

      if (!ownerLand) throw new Error("You do not own this land");
    }

    // Verify land exists and is active
    const { data: land } = await adminClient
      .from("lands")
      .select("id, city, district")
      .eq("id", landId)
      .eq("is_active", true)
      .maybeSingle();

    if (!land) throw new Error("Land not found or inactive");

    // Check existing NDA for this user+land+role
    const { data: existing } = await adminClient
      .from("nda_consents")
      .select("id, status")
      .eq("user_id", user.id)
      .eq("land_id", landId)
      .eq("actor_role", actorRole)
      .maybeSingle();

    if (existing) {
      if (existing.status === "rejected") {
        throw new Error("NDA was previously rejected — this decision is final");
      }
      if (existing.status === "accepted") {
        return new Response(JSON.stringify({ success: true, already_accepted: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // Status is pending — update it
      const now = new Date().toISOString();
      const updates: Record<string, unknown> = {
        status: action === "accept" ? "accepted" : "rejected",
        ip_address: clientIp,
        user_agent: userAgent,
      };
      if (action === "accept") updates.accepted_at = now;
      else updates.rejected_at = now;

      const { error: updateError } = await adminClient
        .from("nda_consents")
        .update(updates)
        .eq("id", existing.id);

      if (updateError) throw new Error("Failed to update NDA consent");
    } else {
      // Insert new record with final status (skip pending)
      const now = new Date().toISOString();
      const { error: insertError } = await adminClient
        .from("nda_consents")
        .insert({
          user_id: user.id,
          land_id: landId,
          actor_role: actorRole,
          nda_version: "1.0",
          nda_text_ar: NDA_TEXT_AR,
          nda_text_en: NDA_TEXT_EN,
          status: action === "accept" ? "accepted" : "rejected",
          accepted_at: action === "accept" ? now : null,
          rejected_at: action === "reject" ? now : null,
          ip_address: clientIp,
          user_agent: userAgent,
        });

      if (insertError) throw new Error("Failed to save NDA consent");
    }

    // ── Auto-transition deal requests when owner accepts NDA ──
    if (actorRole === "owner" && action === "accept") {
      const { data: pendingReqs } = await adminClient
        .from("deal_requests")
        .select("id")
        .eq("land_id", landId)
        .eq("current_phase", "nda_developer_accepted");

      if (pendingReqs && pendingReqs.length > 0) {
        const ids = pendingReqs.map((r: { id: string }) => r.id);
        await adminClient
          .from("deal_requests")
          .update({
            current_phase: "nda_both_accepted",
            owner_nda_status: "accepted",
            identity_reveal_level: "brand_visible",
          })
          .in("id", ids);

        // Log each transition
        for (const r of pendingReqs) {
          await adminClient.from("deal_phase_transitions").insert({
            deal_request_id: r.id,
            from_phase: "nda_developer_accepted",
            to_phase: "nda_both_accepted",
            triggered_by: user.id,
            actor_role: "system",
            reason: "Owner accepted NDA for this land",
            ip_address: clientIp,
            user_agent: userAgent,
          });
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      status: action === "accept" ? "accepted" : "rejected",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "NDA processing failed";
    console.error("[accept-nda] Error:", message);

    const safeMessages = [
      "Unauthorized",
      "land_id is required",
      "action must be",
      "actor_role must be",
      "Developer profile not found",
      "Developer must be verified",
      "You do not own this land",
      "Land not found",
      "NDA was previously rejected",
      "Failed to update NDA",
      "Failed to save NDA",
    ];
    const safe = safeMessages.some(m => message.includes(m)) ? message : "NDA processing failed";
    return new Response(JSON.stringify({ error: safe }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
