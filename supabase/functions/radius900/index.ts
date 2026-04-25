import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit, clientIpFromRequest, rateLimited } from "../_shared/rate-limit.ts";

const publicSiteUrl = Deno.env.get("PUBLIC_SITE_URL") ?? "https://cidoma.com";
const allowedRootDomain = (Deno.env.get("ALLOWED_ROOT_DOMAIN") ?? "cidoma.com").toLowerCase();

// Rate limit: a fresh radius call hits Overpass + Lovable AI, both of which
// cost real money. The 24-hour cache makes the typical loop cheap, but
// `force_refresh=true` bypasses it — so a malicious client could churn
// through OpenAI/Overpass budget with a simple loop. Cap at 20 fresh calls
// per user per hour (+ an IP fallback for anonymous race conditions).
const RADIUS_MAX_PER_HOUR_PER_USER = 20;
const RADIUS_MAX_PER_HOUR_PER_IP = 40;

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
    // --- Auth: require valid JWT + authenticated user ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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

    const { land_id, lat, lng, force_refresh } = await req.json();
    if (!land_id || !lat || !lng) {
      return new Response(JSON.stringify({ error: "land_id, lat, lng required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Per-user rate limit: counts every request regardless of cache hit,
    // because the cost we want to bound is client chatter, not network I/O.
    // The helper fails open if the RPC errors — a broken rate-limit table
    // must never take down a legitimate lookup.
    const userGate = await checkRateLimit(supabase, {
      key: `radius900:user:${user.id}`,
      windowSeconds: 3600,
      maxHits: RADIUS_MAX_PER_HOUR_PER_USER,
    });
    if (!userGate.allowed) return rateLimited(corsHeaders, 3600);

    // Secondary IP gate catches the case where many accounts on the same
    // machine amplify each other (credential-stuffing flavour). Cheap to
    // run — same Postgres function, different key.
    const ipGate = await checkRateLimit(supabase, {
      key: `radius900:ip:${clientIpFromRequest(req)}`,
      windowSeconds: 3600,
      maxHits: RADIUS_MAX_PER_HOUR_PER_IP,
    });
    if (!ipGate.allowed) return rateLimited(corsHeaders, 3600);

    // Check cache (24h)
    if (!force_refresh) {
      const { data: cached } = await supabase
        .from("land_pulse_snapshots")
        .select("*")
        .eq("land_id", land_id)
        .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cached) {
        return new Response(JSON.stringify({ cached: true, ...cached }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Fetch POIs from OpenStreetMap Overpass API (free, no key needed)
    const overpassQuery = `
      [out:json][timeout:10];
      (
        node(around:900,${lat},${lng})["amenity"];
        node(around:900,${lat},${lng})["shop"];
        node(around:900,${lat},${lng})["tourism"];
        node(around:900,${lat},${lng})["building"="commercial"];
        node(around:900,${lat},${lng})["building"="residential"];
        node(around:900,${lat},${lng})["office"];
        node(around:900,${lat},${lng})["leisure"];
        node(around:900,${lat},${lng})["education"];
        node(around:900,${lat},${lng})["healthcare"];
      );
      out body 50;
    `;

    let pois: any[] = [];
    const poiCategories: Record<string, number> = {};

    try {
      const overpassRes = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: `data=${encodeURIComponent(overpassQuery)}`,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      const overpassData = await overpassRes.json();

      pois = (overpassData.elements || []).map((el: any) => ({
        name: el.tags?.name || el.tags?.amenity || el.tags?.shop || "Unknown",
        category: el.tags?.amenity || el.tags?.shop || el.tags?.building || el.tags?.office || "other",
        lat: el.lat,
        lng: el.lon,
      }));

      // Count by category
      pois.forEach(p => {
        poiCategories[p.category] = (poiCategories[p.category] || 0) + 1;
      });
    } catch (e) {
      console.error("Overpass error:", e);
    }

    // Determine area character
    const residentialCount = (poiCategories["residential"] || 0) + (poiCategories["apartments"] || 0);
    const commercialCount = (poiCategories["commercial"] || 0) + (poiCategories["shop"] || 0) + (poiCategories["office"] || 0) + (poiCategories["supermarket"] || 0) + (poiCategories["restaurant"] || 0);
    const total = Math.max(residentialCount + commercialCount, 1);
    const residentialPct = Math.round((residentialCount / total) * 100);
    const commercialPct = 100 - residentialPct;

    const summaryJson = {
      total_pois: pois.length,
      categories: poiCategories,
      area_character: {
        residential_pct: residentialPct,
        commercial_pct: commercialPct,
        dominant: residentialPct > commercialPct ? "residential" : commercialPct > residentialPct ? "commercial" : "mixed",
      },
      top_pois: pois.slice(0, 10).map(p => ({ name: p.name, category: p.category })),
    };

    // Generate AI report
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    let aiReportAr = "";
    const aiReportEn = "";

    if (LOVABLE_API_KEY) {
      try {
        const aiPrompt = `أنت محلل عقاري سعودي خبير. بناءً على البيانات التالية عن محيط أرض بدائرة 900 متر:

إحصائيات النقاط المحيطة: ${JSON.stringify(poiCategories)}
عدد النقاط الإجمالي: ${pois.length}
الطابع العام: سكني ${residentialPct}% / تجاري ${commercialPct}%
أبرز المعالم: ${pois.slice(0, 5).map(p => p.name).join("، ")}

المطلوب:
1. وصف عام للمنطقة (2-3 جمل)
2. نوع المنتج النهائي المقترح (1-2 اقتراحات)
3. مزايا الموقع
4. تحذيرات أو ملاحظات

اكتب تقريراً عربياً مختصراً (150-250 كلمة). أضف تنبيهاً أنه استرشادي وليس استشارة رسمية.`;

        const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              { role: "system", content: "أنت محلل عقاري سعودي متخصص. أجب بالعربية فقط بشكل مهني ومختصر." },
              { role: "user", content: aiPrompt },
            ],
          }),
        });

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          aiReportAr = aiData.choices?.[0]?.message?.content || "";
        } else if (aiRes.status === 429) {
          aiReportAr = "تم تجاوز الحد الأقصى للطلبات. يرجى المحاولة لاحقاً.";
        } else if (aiRes.status === 402) {
          aiReportAr = "يرجى إضافة رصيد لتفعيل التحليل الذكي.";
        }
      } catch (e) {
        console.error("AI report error:", e);
        aiReportAr = "تعذر إنشاء التقرير الذكي حالياً.";
      }
    } else {
      aiReportAr = "تحليل الذكاء الاصطناعي غير متاح حالياً.";
    }

    // Save snapshot
    const { data: snapshot, error: insertError } = await supabase
      .from("land_pulse_snapshots")
      .insert({
        land_id,
        radius_m: 900,
        summary_json: summaryJson,
        pois_list: pois,
        ai_report_ar: aiReportAr,
        ai_report_en: aiReportEn || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(JSON.stringify({ error: "Operation failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ cached: false, ...snapshot }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("radius900 error:", e);
    return new Response(JSON.stringify({ error: "Search operation failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
