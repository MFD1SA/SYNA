// Developer expressed interest in a land → notify the owner.
// Sends the owner a luxury RTL email and creates an in-app notification.
//
// Body: { deal_request_id: string }
// Auth: the caller must be the developer who owns the deal_request, or admin.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildCorsHeaders, renderLuxuryEmail, sendEmail, SITE_URL } from "../_shared/email.ts";
import { createNotification, getAdminClient } from "../_shared/notifications.ts";

interface Payload {
  deal_request_id?: string;
}

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
    const requestId = String(body.deal_request_id ?? "").trim();
    if (!requestId) {
      return new Response(JSON.stringify({ error: "deal_request_id is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

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

    // Load the request, land, developer
    const { data: request, error: reqErr } = await admin
      .from("deal_requests")
      .select("id, land_id, developer_id, proposed_project_type, proposal_summary, lands(city, district, owner_id, project_type), developers(user_id, email, phone, company_name, marketing_brand_name)")
      .eq("id", requestId)
      .maybeSingle();
    if (reqErr || !request) {
      return new Response(JSON.stringify({ error: "Request not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Authorize — caller must be the developer on the request, or admin
    const developer = (request as { developers: { user_id?: string; email?: string; phone?: string; company_name?: string; marketing_brand_name?: string } | null }).developers;
    const land = (request as { lands: { city?: string; district?: string; owner_id?: string; project_type?: string } | null }).lands;
    const { data: adminRole } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (developer?.user_id !== user.id && !adminRole) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!land?.owner_id) {
      return new Response(JSON.stringify({ error: "Owner not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get owner email
    let ownerEmail = "";
    let ownerName = "";
    const { data: ownerProfile } = await admin
      .from("profiles")
      .select("email, full_name")
      .eq("user_id", land.owner_id)
      .maybeSingle();
    if (ownerProfile?.email) {
      ownerEmail = ownerProfile.email as string;
      ownerName = (ownerProfile.full_name as string) || "";
    } else {
      const { data: authUser } = await admin.auth.admin.getUserById(land.owner_id as string);
      ownerEmail = authUser?.user?.email ?? "";
    }

    const devName = (developer?.marketing_brand_name || developer?.company_name || "مطور معتمد").trim();
    const devEmail = (developer?.email || "").trim();
    const devPhone = (developer?.phone || "").trim();
    const location = `${land.city ?? ""}${land.district ? ` — ${land.district}` : ""}`.trim() || "—";
    const proposedType = (request as { proposed_project_type?: string }).proposed_project_type || land.project_type || "—";

    const requestUrl = `${SITE_URL}/owner/requests`;

    // Email to owner
    let emailResult: { ok: boolean; id?: string } = { ok: true };
    if (ownerEmail) {
      const html = renderLuxuryEmail({
        eyebrow: "اهتمام جديد بفرصتك",
        headline: `${devName} مهتم بفرصتك في ${location}`,
        intro: ownerName
          ? `مرحبًا ${ownerName}، استقبلنا اهتمامًا جديدًا بفرصتك. تفاصيل المطور والمقترح أدناه.`
          : "استقبلنا اهتمامًا جديدًا بفرصتك. تفاصيل المطور والمقترح أدناه.",
        rows: [
          { label: "اسم المطور", value: devName },
          ...(devEmail ? [{ label: "البريد", value: devEmail }] : []),
          ...(devPhone ? [{ label: "الجوال", value: devPhone }] : []),
          { label: "الموقع", value: location },
          { label: "نوع المشروع المقترح", value: proposedType },
          ...(request.proposal_summary ? [{ label: "ملخص المقترح", value: String(request.proposal_summary), block: true }] : []),
        ],
        cta: { label: "عرض التفاصيل", url: requestUrl },
        outro: "يمكنك مراجعة المقترح الكامل واتخاذ القرار من لوحة المالك في سينا. جميع بياناتك تبقى محميّة ولا تُكشف للمطور إلا بموافقتك.",
      });
      emailResult = await sendEmail({
        to: ownerEmail,
        subject: "يوجد اهتمام جديد على فرصتك",
        html,
      });
    }

    // In-app notification
    await createNotification({
      userId: land.owner_id as string,
      type: "opportunity_interest",
      titleAr: "اهتمام جديد بفرصتك",
      titleEn: "New interest on your opportunity",
      messageAr: `${devName} أبدى اهتمامًا بفرصتك في ${location}`,
      messageEn: `${devName} expressed interest in your opportunity in ${land.city ?? ""}`,
      entityType: "deal_request",
      entityId: requestId,
    });

    return new Response(
      JSON.stringify({ success: true, email_sent: !!ownerEmail && emailResult.ok, email_id: emailResult.id }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[notify-interest] fatal", msg);
    return new Response(JSON.stringify({ error: "Notification dispatch failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
