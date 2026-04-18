// Fanout notification: owner just published a new opportunity (land listing).
// Sends one email per verified developer + creates an in-app notification.
//
// Called by the frontend after `lands.insert`, or manually by the admin.
// Body: { land_id: string }
//
// Auth: requires a valid user JWT. The caller must either
//   (a) own the land, or
//   (b) have role = admin.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildCorsHeaders, esc, renderLuxuryEmail, sendEmail, SITE_URL } from "../_shared/email.ts";
import { createNotifications, getAdminClient } from "../_shared/notifications.ts";

interface Payload {
  land_id?: string;
}

const USAGE_LABELS_AR: Record<string, string> = {
  residential: "سكني",
  commercial: "تجاري",
  residential_commercial: "سكني تجاري",
  high_density: "كثافة مرتفعة",
};
const USAGE_LABELS_EN: Record<string, string> = {
  residential: "Residential",
  commercial: "Commercial",
  residential_commercial: "Residential + Commercial",
  high_density: "High Density",
};

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const body = (await req.json()) as Payload;
    const landId = String(body.land_id ?? "").trim();
    if (!landId) {
      return new Response(JSON.stringify({ error: "land_id is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Verify caller
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } },
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const admin = getAdminClient();

    // Load the land
    const { data: land, error: landErr } = await admin
      .from("lands")
      .select("id, owner_id, city, district, usage_type, project_type, land_area_sqm, is_active")
      .eq("id", landId)
      .maybeSingle();
    if (landErr || !land) {
      return new Response(JSON.stringify({ error: "Land not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Authorize
    const { data: adminRole } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (land.owner_id !== user.id && !adminRole) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Fetch all verified developers
    const { data: devs, error: devsErr } = await admin
      .from("developers")
      .select("id, user_id, email, company_name, marketing_brand_name")
      .eq("verification_status", "verified");
    if (devsErr) {
      console.error("[notify-new-opportunity] devs query failed", devsErr);
      return new Response(JSON.stringify({ error: "Failed to load developers" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    const devList = devs ?? [];

    const locationAr = `${land.city ?? ""}${land.district ? ` — ${land.district}` : ""}`.trim() || "—";
    const usageAr = USAGE_LABELS_AR[land.usage_type as string] ?? "—";
    const usageEn = USAGE_LABELS_EN[land.usage_type as string] ?? "—";
    const projectType = (land.project_type as string | null) || "—";
    const opportunityUrl = `${SITE_URL}/crm/browse-lands?land=${encodeURIComponent(landId)}`;
    const opportunityTitle = projectType !== "—" ? projectType : `فرصة في ${locationAr}`;

    // Luxury email
    const html = renderLuxuryEmail({
      eyebrow: "فرصة عقارية جديدة",
      headline: `فرصة جديدة متاحة الآن — ${locationAr}`,
      intro: "تم إدراج فرصة عقارية جديدة على منصة سينا. الفرصة متاحة الآن للاطلاع وتقديم اهتمامك قبل أن يتقدّم مطورون آخرون.",
      rows: [
        { label: "اسم الفرصة", value: opportunityTitle },
        { label: "الموقع", value: locationAr },
        { label: "نوع العقار", value: usageAr },
        ...(land.land_area_sqm ? [{ label: "المساحة", value: `${Number(land.land_area_sqm).toLocaleString("ar-SA")} م²` }] : []),
      ],
      cta: { label: "عرض الفرصة", url: opportunityUrl },
      outro: "للاطلاع على التفاصيل الكاملة والتواصل مع المالك، ادخل إلى لوحة المطور في سينا.",
    });

    // Send in parallel batches of 20
    const recipients = devList
      .map((d) => ({ email: (d.email as string | null) || "", userId: d.user_id as string, name: (d.marketing_brand_name || d.company_name) as string }))
      .filter((r) => r.email.includes("@"));

    let sent = 0;
    let failed = 0;
    const batchSize = 20;
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      const results = await Promise.all(
        batch.map((r) =>
          sendEmail({
            to: r.email,
            subject: "فرصة عقارية جديدة متاحة الآن",
            html,
          }),
        ),
      );
      for (const r of results) r.ok ? sent++ : failed++;
    }

    // In-app notifications for every developer user
    const inAppCount = await createNotifications(
      devList
        .filter((d) => d.user_id)
        .map((d) => ({
          userId: d.user_id as string,
          type: "opportunity_new" as const,
          titleAr: "فرصة عقارية جديدة",
          titleEn: "New real estate opportunity",
          messageAr: `فرصة جديدة في ${locationAr} — ${usageAr}`,
          messageEn: `New opportunity in ${esc(land.city as string ?? "")} — ${usageEn}`,
          entityType: "land",
          entityId: landId,
        })),
    );

    return new Response(
      JSON.stringify({ success: true, emails_sent: sent, emails_failed: failed, notifications: inAppCount, developers_total: devList.length }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[notify-new-opportunity] fatal", msg);
    return new Response(JSON.stringify({ error: "Notification dispatch failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
