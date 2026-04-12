import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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

const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") ?? "";
if (!ADMIN_EMAIL) {
  console.error("ADMIN_EMAIL env var is not configured");
}

function escapeHtml(str: string | undefined | null): string {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, subject, message } = await req.json();

    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (String(name).length > 200 || String(email).length > 254 || String(subject || "").length > 500 || String(message).length > 5000) {
      return new Response(
        JSON.stringify({ error: "Input exceeds maximum length" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error: dbError } = await supabase.from("contact_submissions").insert({
      name, email, subject: subject || null, message,
    });
    if (dbError) console.error("DB error:", dbError);

    // Send email via Resend API
    const rawKey = Deno.env.get("RESEND_API_KEY") || "";
    const resendApiKey = rawKey.replace(/[^\x20-\x7E]/g, "").trim();
    if (resendApiKey) {
      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: new Headers([
          ["Authorization", "Bearer " + resendApiKey],
          ["Content-Type", "application/json"],
        ]),
        body: JSON.stringify({
          from: "SYNA Contact <onboarding@resend.dev>",
          to: [ADMIN_EMAIL],
          subject: `New message from ${escapeHtml(name)}: ${escapeHtml(subject) || "No subject"}`,
          html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;direction:rtl">
            <h2 style="color:#1a6fb5">SYNA - New Contact Message</h2>
            <table style="width:100%;border-collapse:collapse;margin-top:16px">
              <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee">Name:</td><td style="padding:8px;border-bottom:1px solid #eee">${escapeHtml(name)}</td></tr>
              <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee">Email:</td><td style="padding:8px;border-bottom:1px solid #eee">${escapeHtml(email)}</td></tr>
              <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee">Subject:</td><td style="padding:8px;border-bottom:1px solid #eee">${escapeHtml(subject) || "—"}</td></tr>
              <tr><td style="padding:8px;font-weight:bold">Message:</td><td style="padding:8px">${escapeHtml(message)}</td></tr>
            </table></div>`,
        }),
      });
      const emailData = await emailRes.json();
      if (!emailRes.ok) {
        console.error("Email error:", emailData);
      } else {
        console.log("Email sent successfully to", ADMIN_EMAIL);
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    console.error("send-contact error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process contact request" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});