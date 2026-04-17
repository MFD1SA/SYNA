import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const publicSiteUrl = Deno.env.get("PUBLIC_SITE_URL") ?? "https://cidoma.com";
const allowedRootDomain = (Deno.env.get("ALLOWED_ROOT_DOMAIN") ?? "cidoma.com").toLowerCase();

/* ── CORS ── */
const isAllowedOrigin = (o: string | null) => {
  if (!o) return false;
  try {
    const h = new URL(o).hostname.toLowerCase();
    return h === allowedRootDomain || h.endsWith(`.${allowedRootDomain}`);
  } catch { return false; }
};
const buildCorsHeaders = (o: string | null) => ({
  "Access-Control-Allow-Origin": isAllowedOrigin(o) ? o! : publicSiteUrl,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  Vary: "Origin",
});

/* ── Reliability scoring ── */
function computeReliability(stats: {
  total: number;
  accepted: number;
  rejected: number;
  cancelled: number;
  accountAgeDays: number;
}): { score: "high" | "medium" | "low"; factors: string[] } {
  const factors: string[] = [];
  let points = 50; // base

  // Account age
  if (stats.accountAgeDays > 365) {
    points += 15;
    factors.push("حساب قديم (أكثر من سنة)");
  } else if (stats.accountAgeDays > 180) {
    points += 10;
    factors.push("حساب بعمر جيد (أكثر من 6 أشهر)");
  } else if (stats.accountAgeDays < 30) {
    points -= 10;
    factors.push("حساب جديد (أقل من شهر)");
  }

  // Request history
  if (stats.total > 5) {
    points += 10;
    factors.push(`نشاط عالي (${stats.total} طلبات)`);
  } else if (stats.total === 0) {
    factors.push("لا توجد طلبات سابقة");
  }

  // Acceptance ratio
  if (stats.total > 0) {
    const acceptRate = stats.accepted / stats.total;
    if (acceptRate >= 0.6) {
      points += 15;
      factors.push(`نسبة قبول ممتازة (${Math.round(acceptRate * 100)}%)`);
    } else if (acceptRate >= 0.3) {
      points += 5;
      factors.push(`نسبة قبول متوسطة (${Math.round(acceptRate * 100)}%)`);
    } else if (stats.total > 2) {
      points -= 10;
      factors.push(`نسبة قبول منخفضة (${Math.round(acceptRate * 100)}%)`);
    }
  }

  // Cancellation ratio
  if (stats.total > 2) {
    const cancelRate = stats.cancelled / stats.total;
    if (cancelRate > 0.5) {
      points -= 15;
      factors.push("نسبة إلغاء عالية");
    }
  }

  const score = points >= 70 ? "high" : points >= 40 ? "medium" : "low";
  return { score, factors };
}

/* ── Website check (lightweight, no scraping) ── */
async function checkWebsite(url: string): Promise<{
  status: "active" | "inactive" | "unknown";
  title: string | null;
}> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch(url, {
      method: "GET",
      signal: ctrl.signal,
      headers: { "User-Agent": "SYNA-Platform/1.0 (website-check)" },
      redirect: "follow",
    });
    clearTimeout(timer);

    if (res.ok) {
      const html = await res.text();
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      return { status: "active", title: titleMatch?.[1]?.trim() || null };
    }
    return { status: "inactive", title: null };
  } catch {
    return { status: "unknown", title: null };
  }
}

/* ── Handler ── */

Deno.serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // ── Admin-only auth check ──
    const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data: roleData } = await adminClient
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
    // ── End auth check ──

    const payload = await req.json();
    const developerId = String(payload.developer_id || "").trim();
    const dealRequestId = payload.deal_request_id ? String(payload.deal_request_id).trim() : null;

    if (!developerId) throw new Error("developer_id is required");

    // Build cache key
    const cacheKey = `dev_${developerId}`;

    // Check for existing valid report (cache: 72h)
    const { data: existingReport } = await adminClient
      .from("developer_reports")
      .select("*")
      .eq("cache_key", cacheKey)
      .eq("status", "completed")
      .gte("created_at", new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingReport) {
      return new Response(JSON.stringify({ success: true, report: existingReport, cached: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create placeholder record
    const { data: reportRow, error: insertErr } = await adminClient
      .from("developer_reports")
      .insert({
        deal_request_id: dealRequestId,
        developer_id: developerId,
        requested_by: user.id,
        status: "generating",
        cache_key: cacheKey,
      })
      .select("id")
      .single();
    if (insertErr) throw new Error(insertErr.message);
    const reportId = reportRow.id;

    try {
      // ── Fetch developer data ──
      const { data: dev, error: devErr } = await adminClient
        .from("developers")
        .select("id, user_id, company_name, marketing_brand_name, cr_number, email, phone, website, verification_status, created_at")
        .eq("id", developerId)
        .single();
      if (devErr || !dev) throw new Error("Developer not found");

      // ── Count requests ──
      const { data: requests } = await adminClient
        .from("deal_requests")
        .select("id, current_phase, status, created_at")
        .eq("developer_id", developerId);

      const allReqs = requests || [];
      const total = allReqs.length;
      const accepted = allReqs.filter(r =>
        ["approved", "study_approved", "meeting_completed", "report_approved",
         "negotiation_active", "final_approval", "closed_won"].includes(r.current_phase || r.status)
      ).length;
      const rejected = allReqs.filter(r =>
        ["closed_lost", "rejected", "study_rejected", "report_rejected"].includes(r.current_phase || r.status)
      ).length;
      const cancelled = allReqs.filter(r =>
        r.current_phase === "cancelled" || r.status === "cancelled"
      ).length;
      const pending = total - accepted - rejected - cancelled;

      // ── Account age ──
      const accountAgeDays = Math.floor(
        (Date.now() - new Date(dev.created_at).getTime()) / (1000 * 60 * 60 * 24)
      );

      // ── Reliability ──
      const { score, factors } = computeReliability({
        total, accepted, rejected, cancelled, accountAgeDays,
      });

      // ── Website check ──
      let websiteStatus: "active" | "inactive" | "unknown" = "unknown";
      if (dev.website) {
        const wsCheck = await checkWebsite(
          dev.website.startsWith("http") ? dev.website : `https://${dev.website}`
        );
        websiteStatus = wsCheck.status;
      }

      // ── Build professional summary ──
      const verText = dev.verification_status === "verified" ? "تم التحقق من الشركة" : "لم يتم التحقق بعد";
      const summaryAr = [
        `${dev.company_name}${dev.marketing_brand_name ? ` (${dev.marketing_brand_name})` : ""}`,
        `${verText}.`,
        total > 0 ? `قدّم ${total} طلب شراكة على المنصة، منها ${accepted} مقبول.` : "لم يقدم طلبات سابقة على المنصة.",
        `مسجل منذ ${accountAgeDays} يومًا.`,
        score === "high" ? "مستوى الموثوقية: عالي." : score === "medium" ? "مستوى الموثوقية: متوسط." : "مستوى الموثوقية: منخفض.",
      ].join(" ");

      const verTextEn = dev.verification_status === "verified" ? "Company verified" : "Not yet verified";
      const summaryEn = [
        `${dev.company_name}${dev.marketing_brand_name ? ` (${dev.marketing_brand_name})` : ""}`,
        `${verTextEn}.`,
        total > 0 ? `Submitted ${total} partnership requests, ${accepted} accepted.` : "No previous requests on the platform.",
        `Registered ${accountAgeDays} days ago.`,
        score === "high" ? "Reliability: High." : score === "medium" ? "Reliability: Medium." : "Reliability: Low.",
      ].join(" ");

      // ── Build report data ──
      const reportData = {
        company_name: dev.company_name,
        brand_name: dev.marketing_brand_name || null,
        cr_number: dev.cr_number || null,
        email: dev.email || null,
        phone: dev.phone || null,
        verification_status: dev.verification_status || "unverified",
        registered_at: dev.created_at,
        website: dev.website || null,
        website_status: websiteStatus,
        total_requests: total,
        accepted_requests: accepted,
        rejected_requests: rejected,
        pending_requests: pending,
        cancelled_requests: cancelled,
        avg_response_hours: null, // can be computed later
        reliability_score: score,
        reliability_factors: factors,
        professional_summary_ar: summaryAr,
        professional_summary_en: summaryEn,
        generated_at: new Date().toISOString(),
      };

      // ── Save report ──
      const { data: finalReport, error: updateErr } = await adminClient
        .from("developer_reports")
        .update({
          status: "completed",
          report_data: reportData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", reportId)
        .select()
        .single();
      if (updateErr) throw new Error(updateErr.message);

      return new Response(JSON.stringify({ success: true, report: finalReport, cached: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (genErr: unknown) {
      const errMsg = genErr instanceof Error ? genErr.message : "Report generation failed";
      // Mark as failed
      await adminClient
        .from("developer_reports")
        .update({ status: "failed", error: errMsg, updated_at: new Date().toISOString() })
        .eq("id", reportId);

      throw new Error(errMsg);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[generate-developer-report] Error:", message);
    return new Response(JSON.stringify({ error: "Report generation failed" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
