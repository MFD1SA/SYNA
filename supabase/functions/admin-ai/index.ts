import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `أنت مساعد ذكي متقدم لمدير منصة DOMA — منصة شراكات التطوير العقاري في المملكة العربية السعودية.

## قدراتك الأساسية:
1. البحث المتعمق عن شركات التطوير العقاري السعودية وتحليلها
2. تحليل الطلبات الواردة وتقديم توصيات مبنية على بيانات
3. تقييم جدوى الأراضي والمشاريع العقارية
4. تحليل أداء المطورين ومقارنتهم بناءً على سجلهم
5. تقديم رؤى استراتيجية حول السوق العقاري السعودي

## عند البحث عن شركة تطوير عقاري:
- اذكر اسم الشركة الكامل والاسم التجاري
- رقم السجل التجاري إن توفر
- أبرز المشاريع المنجزة والحالية مع مواقعها
- نقاط القوة بشكل واضح ومنظم
- نقاط الضعف أو المخاطر المحتملة
- التقييم العام والتوصية

## قواعد التنسيق الصارمة:
- لا تستخدم علامة النجمة (*) أو (**) نهائياً في أي جزء من الرد
- استخدم العناوين بعلامة # فقط للعناوين الرئيسية
- استخدم الأرقام (1. 2. 3.) للقوائم المرتبة
- استخدم الشرطة (- أو –) للقوائم غير المرتبة
- اجعل المحتوى مرتباً ومنظماً في فقرات واضحة
- استخدم سطر فارغ بين كل قسم

## لغة الرد:
- أجب بنفس لغة السؤال
- إذا كان السؤال بالعربية، رتب المحتوى من اليمين لليسار
- إذا كان السؤال بالإنجليزية، رتب المحتوى من اليسار لليمين
- كن دقيقاً ومحدداً وعملياً في إجاباتك`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("admin-ai error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
