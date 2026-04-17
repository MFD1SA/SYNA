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
    // --- Auth: require valid JWT + admin role ---
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

    const adminRoleClient = createClient(supabaseUrl, serviceKey);
    const { data: roleData } = await adminRoleClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // --- End auth check ---

    const { request_id, land_id, model } = await req.json();
    if (!request_id && !land_id) throw new Error("request_id or land_id required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(supabaseUrl, serviceKey);

    // Select AI model - default to gemini-2.5-pro for deeper analysis
    const aiModel = model || "google/gemini-2.5-pro";

    let requestsQuery = supabase
      .from("deal_requests")
      .select("*, developers(company_name, cr_number, cr_extracted_name, marketing_brand_name, email, phone, verification_status, created_at, website)");

    if (request_id) requestsQuery = requestsQuery.eq("id", request_id);
    else requestsQuery = requestsQuery.eq("land_id", land_id);

    const { data: requests, error: reqErr } = await requestsQuery;
    if (reqErr) throw reqErr;
    if (!requests || requests.length === 0) {
      return new Response(JSON.stringify({ analyses: [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const landIds = [...new Set(requests.map(r => r.land_id))];
    const devIds = [...new Set(requests.map(r => r.developer_id))];

    const [landsRes, dealsRes, allReqsRes] = await Promise.all([
      supabase.from("lands").select("id, city, district, land_area_sqm, usage_type, partnership_goal").in("id", landIds),
      supabase.from("deals").select("developer_id, current_stage, health, created_at, closed_at").in("developer_id", devIds),
      supabase.from("deal_requests").select("developer_id, status, created_at").in("developer_id", devIds),
    ]);

    const landsMap: Record<string, any> = {};
    landsRes.data?.forEach(l => { landsMap[l.id] = l; });
    const devDeals: Record<string, any[]> = {};
    dealsRes.data?.forEach(d => { if (!devDeals[d.developer_id]) devDeals[d.developer_id] = []; devDeals[d.developer_id].push(d); });
    const devRequests: Record<string, any[]> = {};
    allReqsRes.data?.forEach(r => { if (!devRequests[r.developer_id]) devRequests[r.developer_id] = []; devRequests[r.developer_id].push(r); });

    const analyses = [];
    for (const request of requests) {
      const dev = request.developers;
      const land = landsMap[request.land_id];
      const deals = devDeals[request.developer_id] || [];
      const allReqs = devRequests[request.developer_id] || [];

      const closedDeals = deals.filter(d => d.current_stage === "deal_closed");
      const cancelledDeals = deals.filter(d => d.current_stage === "deal_cancelled");
      const activeDeals = deals.filter(d => !["deal_closed", "deal_cancelled"].includes(d.current_stage));
      const greenDeals = deals.filter(d => d.health === "green").length;
      const approvedReqs = allReqs.filter(r => r.status === "approved").length;
      const rejectedReqs = allReqs.filter(r => r.status === "rejected").length;

      const devProfile = `
## بيانات المطور:
- اسم الشركة: ${dev?.company_name || "غير محدد"}
- الاسم التجاري: ${dev?.marketing_brand_name || "غير محدد"}
- رقم السجل التجاري: ${dev?.cr_number || "غير محدد"}
- اسم السجل: ${dev?.cr_extracted_name || "غير محدد"}
- الموقع الإلكتروني: ${dev?.website || "لا يوجد"}
- حالة التوثيق: ${dev?.verification_status === "verified" ? "موثق ✅" : "غير موثق ⚠️"}
- تاريخ الانضمام: ${dev?.created_at ? new Date(dev.created_at).toLocaleDateString("ar-SA") : "غير محدد"}

## إحصائيات المطور:
- إجمالي الطلبات: ${allReqs.length}
- مقبولة: ${approvedReqs} | مرفوضة: ${rejectedReqs}
- صفقات نشطة: ${activeDeals.length} | مغلقة: ${closedDeals.length} | ملغاة: ${cancelledDeals.length}
- نسبة الصحة: ${deals.length > 0 ? Math.round((greenDeals / deals.length) * 100) : 0}%

## الطلب الحالي:
- نوع المشروع: ${request.proposed_project_type}
- ملخص المقترح: ${request.proposal_summary}
- المدة: ${request.estimated_duration_months || "غير محدد"} شهر

## الأرض:
- الموقع: ${land?.city || ""} - ${land?.district || ""}
- المساحة: ${land?.land_area_sqm ? Number(land.land_area_sqm).toLocaleString() : ""} م²
- نوع الاستخدام: ${land?.usage_type || ""} | هدف الشراكة: ${land?.partnership_goal || ""}`;

      const prompt = `أنت محلل عقاري خبير في السوق السعودي يعمل في منصة SYNA. حلل المطور التالي الذي تقدم بطلب شراكة وقدم تقييماً دقيقاً ومهنياً.

${devProfile}

قدم تحليلاً شاملاً يشمل:
1. تقييم إجمالي (0-100) مع تفصيل: البروفايل (20)، الإنجازات (30)، المقترح (25)، الموثوقية (25)
2. نقاط القوة (3-5 نقاط)
3. نقاط الضعف والمخاطر (2-4 نقاط)
4. توصية: قبول / تريث / رفض مع السبب
5. نصائح تفاوضية للمالك`;

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: aiModel,
          messages: [{ role: "user", content: prompt }],
          tools: [{
            type: "function",
            function: {
              name: "developer_analysis",
              description: "Structured analysis of a real estate developer",
              parameters: {
                type: "object",
                properties: {
                  overall_score: { type: "number", description: "Overall score 0-100" },
                  profile_score: { type: "number", description: "Profile strength score 0-20" },
                  track_record_score: { type: "number", description: "Track record score 0-30" },
                  proposal_score: { type: "number", description: "Proposal quality score 0-25" },
                  reliability_score: { type: "number", description: "Reliability score 0-25" },
                  recommendation: { type: "string", enum: ["accept", "cautious", "reject"] },
                  recommendation_reason_ar: { type: "string", description: "Recommendation reason in Arabic" },
                  strengths_ar: { type: "array", items: { type: "string" }, description: "Key strengths in Arabic" },
                  weaknesses_ar: { type: "array", items: { type: "string" }, description: "Weaknesses in Arabic" },
                  negotiation_tips_ar: { type: "array", items: { type: "string" }, description: "Negotiation tips in Arabic" },
                  summary_ar: { type: "string", description: "Brief summary in Arabic" },
                },
                required: ["overall_score", "profile_score", "track_record_score", "proposal_score", "reliability_score", "recommendation", "recommendation_reason_ar", "strengths_ar", "weaknesses_ar", "summary_ar"],
                additionalProperties: false,
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "developer_analysis" } },
        }),
      });

      if (!aiResponse.ok) {
        console.error("AI error for request", request.id, await aiResponse.text());
        analyses.push({ request_id: request.id, developer_id: request.developer_id, error: true });
        continue;
      }

      const aiData = await aiResponse.json();
      let analysis: any = {};
      try {
        const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
        if (toolCall?.function?.arguments) analysis = JSON.parse(toolCall.function.arguments);
      } catch { analysis = { overall_score: 0, recommendation: "cautious", summary_ar: "تعذر التحليل" }; }

      analyses.push({
        request_id: request.id, developer_id: request.developer_id,
        developer_name: dev?.company_name || dev?.marketing_brand_name || "غير معروف",
        developer_brand: dev?.marketing_brand_name,
        developer_website: dev?.website || null,
        verification_status: dev?.verification_status,
        proposed_project_type: request.proposed_project_type,
        proposal_summary: request.proposal_summary,
        commission_rate: request.commission_rate,
        estimated_duration_months: request.estimated_duration_months,
        needs_financing: request.needs_financing,
        status: request.status, created_at: request.created_at,
        stats: {
          total_requests: allReqs.length, approved_requests: approvedReqs, rejected_requests: rejectedReqs,
          active_deals: activeDeals.length, closed_deals: closedDeals.length, cancelled_deals: cancelledDeals.length,
          health_ratio: deals.length > 0 ? Math.round((greenDeals / deals.length) * 100) : 0,
        },
        ai_analysis: analysis,
      });
    }

    return new Response(JSON.stringify({ analyses }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("analyze-developer error:", e);
    return new Response(JSON.stringify({ error: "Developer analysis failed" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
