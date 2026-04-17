import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  Vary: "Origin",
});

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Authenticate the caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify admin role
    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden: admin only" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages, model: requestedModel } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Fetch platform stats for context
    let platformContext = "";
    try {
      const [landsRes, devsRes, dealsRes, requestsRes] = await Promise.all([
        adminClient.from("lands").select("id, city, is_active, owner_approved", { count: "exact", head: true }),
        adminClient.from("developers").select("id, verification_status", { count: "exact", head: true }),
        adminClient.from("deals").select("id, current_stage", { count: "exact", head: true }),
        adminClient.from("deal_requests").select("id, status", { count: "exact", head: true }),
      ]);
      platformContext = `
## بيانات المنصة الحالية (للسياق فقط):
- إجمالي الأراضي المسجلة: ${landsRes.count ?? 0}
- إجمالي المطورين المسجلين: ${devsRes.count ?? 0}
- إجمالي الصفقات: ${dealsRes.count ?? 0}
- إجمالي طلبات الشراكة: ${requestsRes.count ?? 0}
`;
    } catch { /* ignore stats fetch errors */ }

    const systemPrompt = `أنت المساعد الذكي لمنصة SYNA — منصة شراكات التطوير العقاري في المملكة العربية السعودية.
أنت مدعوم بأحدث نماذج الذكاء الاصطناعي (GPT-5 و Gemini Pro) لتقديم تحليلات عميقة ودقيقة.

## هويتك:
- اسمك: مساعد SYNA الذكي
- دورك: مستشار عقاري ذكي متقدم لمدير منصة SYNA
- تخصصك: التطوير العقاري، تحليل الشركات، تقييم الأراضي في السوق السعودي
- قدراتك: تحليل متعمق، بحث شامل، استشارات استراتيجية، تقارير احترافية

${platformContext}

## قدراتك المتقدمة:
1. البحث والتحليل المتعمق لشركات التطوير العقاري السعودية والخليجية
2. تقييم جدوى الأراضي والمشاريع العقارية مع مؤشرات كمية
3. تحليل SWOT متقدم للمطورين والمشاريع
4. تقديم توصيات استراتيجية مبنية على بيانات السوق
5. مقارنة شركات التطوير وتصنيفها حسب معايير متعددة
6. تحليل المناطق الجغرافية وفرص التطوير
7. تقدير المخاطر وفرص العائد الاستثماري
8. كتابة التقارير والعروض التقديمية
9. تحليل الاتجاهات العقارية ورؤية 2030

## قواعد الرد الصارمة:

### 1. الدقة والمصداقية:
- أجب فقط بمعلومات تثق بصحتها
- إذا لم تكن متأكداً، قل ذلك صراحة
- لا تختلق أرقام أو إحصائيات غير حقيقية
- ميّز بوضوح بين الحقائق والتقديرات والآراء

### 2. التعامل مع الأسئلة:
- سؤال واضح: أجب بدقة ومباشرة مع تفصيل كافٍ
- سؤال غامض: اطلب توضيحاً قبل الإجابة
- سؤال خارج النطاق: اعتذر بلباقة ووجّه للموضوع المناسب

### 3. هيكل الرد (عند الحاجة):

# [العنوان الرئيسي]

## ملخص سريع
[جملتان أو ثلاث تلخص الإجابة]

## التفاصيل
[معلومات منظمة في نقاط واضحة]

## التوصيات
[خطوات عملية مقترحة]

## ملاحظات
[تحفظات أو معلومات إضافية مهمة]

### 4. تنسيق النص:
- استخدم العناوين بعلامة # 
- استخدم الأرقام للقوائم المرتبة
- استخدم الشرطة - للقوائم غير المرتبة
- استخدم **نص غامق** للتأكيد على النقاط المهمة
- استخدم الجداول عند المقارنة
- اترك سطراً فارغاً بين كل قسم

### 5. لغة الرد:
- أجب بنفس لغة السؤال تلقائياً
- استخدم مصطلحات SYNA الرسمية: شراكة تطوير، مالك أرض، مطور عقاري، صفقة

### 6. عند البحث عن شركة:
1. اسم الشركة الرسمي والتجاري
2. سنة التأسيس والمقر الرئيسي
3. رقم السجل التجاري (إن توفر)
4. أبرز المشاريع المنجزة والحالية مع المواقع
5. التخصص الرئيسي (سكني/تجاري/مختلط)
6. حجم الشركة والملاءة المالية
7. نقاط القوة والضعف
8. التقييم العام من 10 مع التبرير
9. التوصية: هل يُنصح بالشراكة؟ ولماذا؟

### 7. منع التكرار وضمان الجودة:
- لا تكرر نفس المعلومة بصياغات مختلفة
- كن مختصراً في الأسئلة البسيطة ومفصّلاً في التحليلات المعقدة
- قدم قيمة مضافة في كل رد`;

    // Select model - default to gemini-2.5-pro for best quality, allow override
    const model = requestedModel || "google/gemini-2.5-pro";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "تم تجاوز حد الطلبات. يرجى المحاولة بعد قليل." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "يرجى إضافة رصيد للاستمرار في استخدام المساعد الذكي." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "خطأ في الاتصال بالذكاء الاصطناعي" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("admin-ai error:", e);
    return new Response(JSON.stringify({ error: "AI operation failed" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
