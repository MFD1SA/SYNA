// Public "Contact Us" endpoint.
// - Stores the submission in contact_submissions (best-effort)
// - Creates an in-app notification for the admin recipient (if registered)
// - Sends a luxury RTL Resend email to the admin inbox
// - Accepts reply_to = submitter's email so admin can reply directly
//
// CORS is locked to cidoma.com + subdomains.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  ADMIN_EMAIL,
  buildCorsHeaders,
  esc,
  renderLuxuryEmail,
  sendEmail,
  SITE_URL,
} from "../_shared/email.ts";
import { createNotification } from "../_shared/notifications.ts";
import { checkRateLimit, clientIpFromRequest, rateLimited } from "../_shared/rate-limit.ts";

interface ContactPayload {
  name?: string;
  email?: string;
  phone?: string;
  subject?: string;
  message?: string;
}

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const body = (await req.json()) as ContactPayload;
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const subject = String(body.subject ?? "").trim();
    const message = String(body.message ?? "").trim();

    if (!name || !email || !message) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    if (name.length > 200 || email.length > 254 || subject.length > 500 || message.length > 5000 || phone.length > 40) {
      return new Response(JSON.stringify({ error: "Input exceeds maximum length" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: "Invalid email" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Best-effort persistence
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    // Rate limit — two dimensions so one bad actor can't block legitimate neighbours:
    //   - IP: 5 submissions / hour (blocks floods from a single host)
    //   - email: 3 submissions / hour (blocks spamming one inbox even via proxies)
    const clientIp = clientIpFromRequest(req);
    const ipGate = await checkRateLimit(supabase, {
      key: `send-contact:ip:${clientIp}`,
      windowSeconds: 3600,
      maxHits: 5,
    });
    if (!ipGate.allowed) return rateLimited(corsHeaders, 3600);
    const emailGate = await checkRateLimit(supabase, {
      key: `send-contact:email:${email.toLowerCase()}`,
      windowSeconds: 3600,
      maxHits: 3,
    });
    if (!emailGate.allowed) return rateLimited(corsHeaders, 3600);
    try {
      await supabase.from("contact_submissions").insert({
        name,
        email,
        subject: subject || null,
        message,
        phone: phone || null,
      } as Record<string, unknown>);
    } catch (e) {
      console.error("[send-contact] DB insert failed (non-fatal)", e);
    }

    // In-app notification for admin (if the admin has a matching auth user)
    try {
      const { data: adminUser } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("email", ADMIN_EMAIL)
        .maybeSingle();
      if (adminUser?.user_id) {
        await createNotification({
          userId: adminUser.user_id,
          type: "contact",
          titleAr: "رسالة جديدة من نموذج اتصل بنا",
          titleEn: "New contact form message",
          messageAr: `${name} أرسل رسالة${subject ? ` بعنوان: ${subject}` : ""}`,
          messageEn: `${name} sent a message${subject ? ` — ${subject}` : ""}`,
          entityType: "contact_submission",
        });
      }
    } catch (e) {
      console.error("[send-contact] notification failed (non-fatal)", e);
    }

    // Luxury RTL email
    const rows = [
      { label: "الاسم", value: name },
      { label: "الجوال", value: phone || "—" },
      { label: "البريد", value: email },
      ...(subject ? [{ label: "الموضوع", value: subject }] : []),
      { label: "الرسالة", value: message, block: true },
    ];

    const html = renderLuxuryEmail({
      eyebrow: "نموذج التواصل",
      headline: "رسالة جديدة من نموذج اتصل بنا",
      intro: "تم استلام رسالة جديدة عبر موقع سينا. التفاصيل الكاملة أدناه — يمكنك الرد مباشرة على هذا البريد للتواصل مع العميل.",
      rows,
      cta: { label: "الردّ على العميل", url: `mailto:${email}` },
      outro: `البريد المرسِل: ${esc(email)}`,
    });

    const result = await sendEmail({
      to: ADMIN_EMAIL,
      subject: "رسالة جديدة من نموذج اتصل بنا",
      html,
      replyTo: email,
    });

    if (!result.ok) {
      console.error("[send-contact] email send failed", result.error);
      return new Response(
        JSON.stringify({ success: false, error: "Email delivery failed" }),
        { status: 502, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    return new Response(JSON.stringify({ success: true, id: result.id }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[send-contact] fatal", msg);
    return new Response(
      JSON.stringify({ error: "Failed to process contact request" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }
});
