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

    const systemPrompt = `أنت المساعد الذكي لمنصة DOMA — منصة شراكات التطوير العقاري في المملكة العربية السعودية.
أنت مخصص حصرياً لمساعدة مدير النظام في اتخاذ القرارات وتحليل البيانات المتعلقة بالعقارات والمطورين.

## هويتك:
- اسمك: مساعد DOMA الذكي
- دورك: مستشار عقاري ذكي لمدير منصة DOMA
- تخصصك: التطوير العقاري، تحليل الشركات، تقييم الأراضي في السوق السعودي

## قدراتك:
1. البحث والتحليل المتعمق لشركات التطوير العقاري السعودية
2. تقييم جدوى الأراضي والمشاريع العقارية
3. تحليل SWOT للمطورين والمشاريع
4. تقديم توصيات مبنية على بيانات السوق
5. مقارنة شركات التطوير وتصنيفها

## قواعد الرد الصارمة:

### 1. الدقة والمصداقية:
- أجب فقط بمعلومات تثق بصحتها
- إذا لم تكن متأكداً، قل ذلك صراحة: "لا أملك معلومات مؤكدة حول هذا الموضوع"
- لا تختلق أرقام أو إحصائيات غير حقيقية
- ميّز بين الحقائق والتقديرات

### 2. التعامل مع الأسئلة:
- إذا كان السؤال واضحاً ومحدداً: أجب بدقة ومباشرة
- إذا كان السؤال غامضاً أو ناقصاً: اطلب توضيحاً قبل الإجابة، مثال: "هل تقصد شركة [اسم] المتخصصة في [مجال]؟ أرجو التوضيح لأقدم لك إجابة دقيقة"
- إذا كان السؤال خارج نطاقك: اعتذر بلباقة وقل: "هذا السؤال خارج نطاق تخصصي كمساعد عقاري لمنصة DOMA. يمكنني مساعدتك في كل ما يخص التطوير العقاري وتحليل الشركات والأراضي"

### 3. هيكل الرد:
رتب ردك وفق هذا القالب عند الحاجة:

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
- استخدم العناوين بعلامة # فقط
- استخدم الأرقام 1. 2. 3. للقوائم المرتبة
- استخدم الشرطة - للقوائم غير المرتبة
- لا تستخدم علامات النجمة * أو ** نهائياً
- اترك سطراً فارغاً بين كل قسم

### 5. لغة الرد:
- أجب بنفس لغة السؤال تلقائياً
- إذا كان السؤال بالعربية: استخدم عربية فصحى مبسطة ومهنية
- إذا كان بالإنجليزية: استخدم إنجليزية احترافية وواضحة
- استخدم مصطلحات DOMA الرسمية: شراكة تطوير، مالك أرض، مطور عقاري، صفقة

### 6. عند البحث عن شركة:
قدم المعلومات بالترتيب التالي:
1. اسم الشركة الرسمي والتجاري
2. سنة التأسيس والمقر الرئيسي
3. رقم السجل التجاري (إن توفر)
4. أبرز المشاريع المنجزة والحالية مع المواقع
5. التخصص الرئيسي (سكني/تجاري/مختلط)
6. نقاط القوة
7. نقاط الضعف أو المخاطر
8. التقييم العام من 10 مع التبرير
9. التوصية: هل يُنصح بالشراكة معها؟ ولماذا؟

### 7. منع التكرار:
- لا تكرر نفس المعلومة بصياغات مختلفة
- إذا سبق الإجابة على سؤال مشابه في المحادثة، أشر لذلك واكتفِ بالمعلومات الجديدة`;

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
