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
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  Vary: "Origin",
});

async function firecrawlScrape(apiKey: string, url: string) {
  const resp = await fetch("https://api.firecrawl.dev/v1/scrape", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true, waitFor: 3000 }),
  });
  if (!resp.ok) throw new Error(`Scrape failed (${resp.status})`);
  const data = await resp.json();
  return data?.data?.markdown || data?.markdown || "";
}

async function firecrawlSearch(apiKey: string, query: string, limit = 10) {
  const resp = await fetch("https://api.firecrawl.dev/v1/search", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, limit, scrapeOptions: { formats: ["markdown"] } }),
  });
  if (!resp.ok) return [];
  const data = await resp.json();
  return data?.data || [];
}

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // --- Auth: require valid JWT + authenticated user ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // --- End auth check ---

    const { website_url, developer_name, developer_id, model } = await req.json();
    if (!website_url) throw new Error("website_url is required");

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) throw new Error("FIRECRAWL_API_KEY not configured");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Use stronger model for website analysis
    const aiModel = model || "google/gemini-2.5-pro";

    let formattedUrl = website_url.trim();
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = `https://${formattedUrl}`;
    }

    const searchName = developer_name || formattedUrl.replace(/https?:\/\//, "").split("/")[0];

    const [websiteContent, socialResults, newsResults] = await Promise.all([
      firecrawlScrape(FIRECRAWL_API_KEY, formattedUrl).catch(() => ""),
      firecrawlSearch(FIRECRAWL_API_KEY, `"${searchName}" site:linkedin.com OR site:twitter.com OR site:x.com OR site:instagram.com OR site:youtube.com`, 8).catch(() => []),
      firecrawlSearch(FIRECRAWL_API_KEY, `"${searchName}" شركة تطوير عقاري أخبار مشاريع`, 10).catch(() => []),
    ]);

    if (!websiteContent || websiteContent.length < 50) {
      return new Response(JSON.stringify({ success: false, error: "لم يتم العثور على محتوى كافٍ في الموقع" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const truncatedWeb = websiteContent.slice(0, 12000);

    const socialSummary = socialResults.length > 0
      ? socialResults.map((r: any) => `- ${r.title || ""}: ${r.url || ""}\n${(r.description || r.markdown || "").slice(0, 250)}`).join("\n")
      : "لم يتم العثور على حسابات سوشيال ميديا";

    const newsSummary = newsResults.length > 0
      ? newsResults.map((r: any) => `- ${r.title || ""}: ${r.url || ""}\n${(r.description || r.markdown || "").slice(0, 350)}`).join("\n")
      : "لم يتم العثور على أخبار";

    const prompt = `أنت محلل أعمال عقاري خبير في السوق السعودي تعمل في منصة SYNA. حلل جميع البيانات التالية عن شركة التطوير وقدم تقييماً شاملاً ودقيقاً.

## اسم المطور: ${searchName}
## رابط الموقع: ${formattedUrl}

## محتوى الموقع الإلكتروني:
${truncatedWeb}

## حسابات السوشيال ميديا المكتشفة:
${socialSummary}

## الأخبار والمقالات المكتشفة:
${newsSummary}

## المطلوب:
حلل كل ما سبق وقدم تقييماً شاملاً يشمل تحليل الموقع والسوشيال ميديا والأخبار بتفصيل كامل ودقيق.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: aiModel,
        messages: [{ role: "user", content: prompt }],
        tools: [{
          type: "function",
          function: {
            name: "website_analysis",
            description: "Structured analysis of a developer company based on website, social media, and news",
            parameters: {
              type: "object",
              properties: {
                company_overview_ar: { type: "string", description: "Detailed company overview in Arabic" },
                projects_count: { type: "number", description: "Estimated number of projects" },
                projects_summary_ar: { type: "string", description: "Detailed summary of projects in Arabic" },
                website_quality_score: { type: "number", description: "Website quality score 0-100" },
                financial_strength_indicators_ar: { type: "string", description: "Financial indicators in Arabic" },
                overall_score: { type: "number", description: "Overall score 0-100" },
                strengths_ar: { type: "array", items: { type: "string" }, description: "Strengths in Arabic" },
                weaknesses_ar: { type: "array", items: { type: "string" }, description: "Weaknesses in Arabic" },
                recommendation_ar: { type: "string", description: "Detailed recommendation for land owner in Arabic" },
                recommendation_level: { type: "string", enum: ["strong", "moderate", "weak"] },
                notable_projects_ar: { type: "array", items: { type: "string" }, description: "Notable projects in Arabic" },
                social_media_presence: {
                  type: "object",
                  properties: {
                    overall_strength: { type: "string", enum: ["strong", "moderate", "weak", "absent"] },
                    platforms_found: { type: "array", items: { type: "object", properties: { platform: { type: "string" }, url: { type: "string" }, summary_ar: { type: "string" } }, required: ["platform", "url", "summary_ar"] } },
                    analysis_ar: { type: "string" },
                  },
                  required: ["overall_strength", "platforms_found", "analysis_ar"],
                },
                news_intelligence: {
                  type: "object",
                  properties: {
                    coverage_level: { type: "string", enum: ["high", "moderate", "low", "none"] },
                    articles: { type: "array", items: { type: "object", properties: { title_ar: { type: "string" }, url: { type: "string" }, sentiment: { type: "string", enum: ["positive", "neutral", "negative"] }, summary_ar: { type: "string" } }, required: ["title_ar", "sentiment", "summary_ar"] } },
                    analysis_ar: { type: "string" },
                  },
                  required: ["coverage_level", "articles", "analysis_ar"],
                },
              },
              required: ["company_overview_ar", "projects_count", "projects_summary_ar", "website_quality_score", "overall_score", "strengths_ar", "weaknesses_ar", "recommendation_ar", "recommendation_level", "social_media_presence", "news_intelligence"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "website_analysis" } },
      }),
    });

    if (!aiResponse.ok) throw new Error("AI analysis failed");

    const aiData = await aiResponse.json();
    let analysis: any = {};
    try {
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) analysis = JSON.parse(toolCall.function.arguments);
    } catch { analysis = { overall_score: 0, recommendation_level: "weak", company_overview_ar: "تعذر تحليل الموقع" }; }

    return new Response(JSON.stringify({
      success: true, website_url: formattedUrl, developer_id: developer_id || null, developer_name: searchName, analysis,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("analyze-developer-website error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
