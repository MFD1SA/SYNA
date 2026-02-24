import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { website_url, developer_name, developer_id } = await req.json();

    if (!website_url) throw new Error("website_url is required");

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) throw new Error("FIRECRAWL_API_KEY not configured");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Format URL
    let formattedUrl = website_url.trim();
    if (
      !formattedUrl.startsWith("http://") &&
      !formattedUrl.startsWith("https://")
    ) {
      formattedUrl = `https://${formattedUrl}`;
    }

    console.log("Scraping developer website:", formattedUrl);

    // Step 1: Scrape the website with Firecrawl
    const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats: ["markdown"],
        onlyMainContent: true,
        waitFor: 3000,
      }),
    });

    if (!scrapeResponse.ok) {
      const errText = await scrapeResponse.text();
      console.error("Firecrawl error:", scrapeResponse.status, errText);
      throw new Error(`Failed to scrape website (${scrapeResponse.status})`);
    }

    const scrapeData = await scrapeResponse.json();
    const websiteContent =
      scrapeData?.data?.markdown || scrapeData?.markdown || "";

    if (!websiteContent || websiteContent.length < 50) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "لم يتم العثور على محتوى كافٍ في الموقع",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Truncate content to avoid token limits
    const truncated = websiteContent.slice(0, 12000);

    console.log(
      "Website scraped successfully, content length:",
      truncated.length
    );

    // Step 2: Analyze with AI using tool calling
    const prompt = `أنت محلل أعمال عقاري خبير في السوق السعودي. قم بتحليل الموقع الإلكتروني لشركة التطوير العقاري التالية وقدم تقييماً شاملاً.

## اسم المطور: ${developer_name || "غير محدد"}
## رابط الموقع: ${formattedUrl}

## محتوى الموقع الإلكتروني:
${truncated}

## المطلوب:
حلل هذا الموقع وقدم تقييماً شاملاً يشمل:
1. نظرة عامة عن الشركة ونشأتها وحجمها
2. المشاريع المنجزة والحالية (عددها، أنواعها، مواقعها)
3. مؤشرات القوة المالية والتشغيلية
4. جودة الموقع الإلكتروني كمؤشر على احترافية الشركة
5. نقاط القوة الرئيسية
6. نقاط الضعف أو المخاطر المحتملة
7. تقييم عام ونصيحة للمالك`;

    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: prompt }],
          tools: [
            {
              type: "function",
              function: {
                name: "website_analysis",
                description:
                  "Structured analysis of a developer company based on their website",
                parameters: {
                  type: "object",
                  properties: {
                    company_overview_ar: {
                      type: "string",
                      description:
                        "Company overview in Arabic (founding, size, specialization)",
                    },
                    projects_count: {
                      type: "number",
                      description:
                        "Estimated number of projects found on website",
                    },
                    projects_summary_ar: {
                      type: "string",
                      description:
                        "Summary of projects found (types, cities, scale) in Arabic",
                    },
                    website_quality_score: {
                      type: "number",
                      description:
                        "Website professionalism score 0-100 (design, content, transparency)",
                    },
                    financial_strength_indicators_ar: {
                      type: "string",
                      description:
                        "Financial strength indicators found in Arabic",
                    },
                    overall_score: {
                      type: "number",
                      description: "Overall developer strength score 0-100",
                    },
                    strengths_ar: {
                      type: "array",
                      items: { type: "string" },
                      description: "Key strengths in Arabic (3-5 items)",
                    },
                    weaknesses_ar: {
                      type: "array",
                      items: { type: "string" },
                      description: "Key weaknesses/risks in Arabic (2-4 items)",
                    },
                    recommendation_ar: {
                      type: "string",
                      description:
                        "Recommendation and advice for land owner in Arabic",
                    },
                    recommendation_level: {
                      type: "string",
                      enum: ["strong", "moderate", "weak"],
                      description:
                        "Overall recommendation level based on website presence",
                    },
                    notable_projects_ar: {
                      type: "array",
                      items: { type: "string" },
                      description:
                        "Notable projects mentioned on the website in Arabic",
                    },
                  },
                  required: [
                    "company_overview_ar",
                    "projects_count",
                    "projects_summary_ar",
                    "website_quality_score",
                    "overall_score",
                    "strengths_ar",
                    "weaknesses_ar",
                    "recommendation_ar",
                    "recommendation_level",
                  ],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "website_analysis" },
          },
        }),
      }
    );

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      throw new Error("AI analysis failed");
    }

    const aiData = await aiResponse.json();
    let analysis: any = {};

    try {
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        analysis = JSON.parse(toolCall.function.arguments);
      }
    } catch (e) {
      console.error("Parse error:", e);
      analysis = {
        overall_score: 0,
        recommendation_level: "weak",
        company_overview_ar: "تعذر تحليل الموقع",
      };
    }

    return new Response(
      JSON.stringify({
        success: true,
        website_url: formattedUrl,
        developer_id: developer_id || null,
        developer_name: developer_name || null,
        analysis,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("analyze-developer-website error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
