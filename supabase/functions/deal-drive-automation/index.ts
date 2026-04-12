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

type Action = "validate_link" | "submit_drive_link" | "close_deal";

interface RequestPayload {
  action: Action;
  dealId?: string;
  documentUrl?: string;
}

const DRIVE_HOSTS = new Set(["drive.google.com", "docs.google.com"]);

const parseDriveUrl = (value?: string) => {
  if (!value) {
    throw new Error("Google Drive URL is required");
  }

  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error("Invalid URL format");
  }

  if (!DRIVE_HOSTS.has(url.hostname)) {
    throw new Error("Only Google Drive links are allowed");
  }

  if (!["https:", "http:"].includes(url.protocol)) {
    throw new Error("Invalid URL protocol");
  }

  return url.toString();
};

const checkLinkReachability = async (url: string) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, { method: "GET", redirect: "follow", signal: controller.signal });
    const finalUrl = response.url || url;

    if (!response.ok) {
      throw new Error(`Link fetch failed (${response.status})`);
    }

    if (finalUrl.includes("ServiceLogin")) {
      throw new Error("Link requires login. Please make it accessible");
    }

    return { ok: true, status: response.status, finalUrl };
  } finally {
    clearTimeout(timeout);
  }
};

const getActor = async (userClient: ReturnType<typeof createClient>) => {
  const {
    data: { user },
    error,
  } = await userClient.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized");
  }

  return user;
};

const notifyOwnerAndAdmins = async (
  adminClient: ReturnType<typeof createClient>,
  params: {
    ownerId: string;
    dealId: string;
    titleAr: string;
    titleEn: string;
    messageAr: string;
    messageEn: string;
    type: string;
  },
) => {
  const { data: adminRows } = await adminClient.from("user_roles").select("user_id").eq("role", "admin");
  const adminIds = (adminRows || []).map((r: any) => r.user_id);
  const recipients = Array.from(new Set([params.ownerId, ...adminIds].filter(Boolean)));

  if (!recipients.length) return;

  await adminClient.from("notifications").insert(
    recipients.map((userId) => ({
      user_id: userId,
      type: params.type,
      title_ar: params.titleAr,
      title_en: params.titleEn,
      message_ar: params.messageAr,
      message_en: params.messageEn,
      entity_type: "deal",
      entity_id: params.dealId,
    })),
  );
};

Deno.serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    if (!SUPABASE_URL) throw new Error("SUPABASE_URL is not configured");

    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    if (!SUPABASE_ANON_KEY) throw new Error("SUPABASE_ANON_KEY is not configured");

    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const payload = (await req.json()) as RequestPayload;

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const actor = await getActor(userClient);

    if (payload.action === "validate_link") {
      const normalizedUrl = parseDriveUrl(payload.documentUrl);
      const result = await checkLinkReachability(normalizedUrl);

      return new Response(
        JSON.stringify({ success: true, valid: true, fetched: true, status: result.status, finalUrl: result.finalUrl }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    if (!payload.dealId) {
      throw new Error("dealId is required");
    }

    const { data: deal, error: dealError } = await userClient
      .from("deals")
      .select("id, owner_id, current_stage, lands(city, district), developers(company_name, marketing_brand_name)")
      .eq("id", payload.dealId)
      .maybeSingle();

    if (dealError || !deal) {
      throw new Error("Deal not found or access denied");
    }

    const developerName =
      (deal as any)?.developers?.marketing_brand_name || (deal as any)?.developers?.company_name || "Developer";
    const city = (deal as any)?.lands?.city || "";
    const district = (deal as any)?.lands?.district || "";

    if (payload.action === "submit_drive_link") {
      const normalizedUrl = parseDriveUrl(payload.documentUrl);
      await checkLinkReachability(normalizedUrl);

      if (deal.current_stage !== "documents_exchanged") {
        throw new Error("Deal must be in documents stage");
      }

      const { data: insertedDoc, error: docError } = await (userClient as any)
        .from("deal_documents")
        .insert({
          deal_id: payload.dealId,
          created_by: actor.id,
          document_url: normalizedUrl,
          document_source: "google_drive",
          verified: true,
          verified_at: new Date().toISOString(),
        })
        .select("*")
        .single();

      if (docError) {
        throw new Error(docError.message || "Failed to save document link");
      }

      const { data: updatedDeal, error: updateError } = await userClient
        .from("deals")
        .update({ current_stage: "agreements_prepared" })
        .eq("id", payload.dealId)
        .eq("current_stage", "documents_exchanged")
        .select("id, current_stage, closed_at")
        .single();

      if (updateError || !updatedDeal) {
        throw new Error(updateError?.message || "Failed to advance deal stage");
      }

      await userClient.from("deal_stages_log").insert({
        deal_id: payload.dealId,
        from_stage: "documents_exchanged",
        to_stage: "agreements_prepared",
        changed_by: actor.id,
        notes: "Developer approved Google Drive documents link",
      });

      await userClient.from("deal_logs").insert({
        deal_id: payload.dealId,
        performed_by: actor.id,
        action: "documents_link_submitted",
        details: normalizedUrl,
      });

      await notifyOwnerAndAdmins(adminClient, {
        ownerId: deal.owner_id,
        dealId: payload.dealId,
        type: "deal_documents_confirmed",
        titleAr: "تم اعتماد المستندات",
        titleEn: "Documents Confirmed",
        messageAr: `قام المطور ${developerName} باعتماد رابط مستندات Google Drive وبدأت مرحلة الاتفاقيات (${city}${district ? ` - ${district}` : ""}).`,
        messageEn: `Developer ${developerName} confirmed the Google Drive documents link and agreements stage started (${city}${district ? ` - ${district}` : ""}).`,
      });

      return new Response(JSON.stringify({ success: true, deal: updatedDeal, document: insertedDoc }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (payload.action === "close_deal") {
      if (deal.current_stage !== "agreements_prepared") {
        throw new Error("Deal must be in agreements stage");
      }

      const closedAt = new Date().toISOString();

      const { data: updatedDeal, error: closeError } = await userClient
        .from("deals")
        .update({ current_stage: "deal_closed", closed_at: closedAt })
        .eq("id", payload.dealId)
        .eq("current_stage", "agreements_prepared")
        .select("id, current_stage, closed_at")
        .single();

      if (closeError || !updatedDeal) {
        throw new Error(closeError?.message || "Failed to close deal");
      }

      await userClient.from("deal_stages_log").insert({
        deal_id: payload.dealId,
        from_stage: "agreements_prepared",
        to_stage: "deal_closed",
        changed_by: actor.id,
        notes: "Deal closed from developer workflow",
      });

      await userClient.from("deal_logs").insert({
        deal_id: payload.dealId,
        performed_by: actor.id,
        action: "deal_closed",
        details: "Deal successfully closed",
      });

      await notifyOwnerAndAdmins(adminClient, {
        ownerId: deal.owner_id,
        dealId: payload.dealId,
        type: "deal_closed",
        titleAr: "مبروك! أُغلقت الصفقة",
        titleEn: "Congratulations! Deal Closed",
        messageAr: `تم إغلاق الصفقة بنجاح بين المالك والمطور ${developerName}.`,
        messageEn: `The deal between the owner and developer ${developerName} has been closed successfully.`,
      });

      return new Response(JSON.stringify({ success: true, deal: updatedDeal }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ error: "Unsupported action" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  } catch (error) {
    const raw = error instanceof Error ? error.message : "Unknown error";
    console.error("deal-drive-automation error:", raw);
    const safeMessages = [
      "Google Drive URL is required", "Invalid URL format", "Only Google Drive links are allowed",
      "Invalid URL protocol", "Link requires login", "Unauthorized", "Missing authorization",
      "dealId is required", "Deal not found or access denied",
      "Deal must be in documents stage", "Deal must be in agreements stage",
    ];
    const message = safeMessages.some(m => raw.includes(m)) ? raw : "Operation failed";
    return new Response(JSON.stringify({ success: false, error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
