// Owner invitation flow.
//
// Admin (or supervisor/specialist via is_high_control) calls this endpoint
// with an email + optional full name. We:
//   1. Create the auth user (no password — invite link path).
//   2. Assign role `owner` in user_roles.
//   3. Generate a one-time invite link via the admin API that lands on
//      `/auth/set-password` so the owner can set their password.
//   4. Send a branded Resend email with the link.
//   5. Log an audit row and best-effort in-app notification.
//
// Idempotency: if the email already exists as an auth user we re-send a new
// invite link instead of recreating the user. Existing role rows are kept.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit, rateLimited } from "../_shared/rate-limit.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
const publicSiteUrl = Deno.env.get("PUBLIC_SITE_URL") ?? "https://cidoma.com";
const allowedRootDomain = (Deno.env.get("ALLOWED_ROOT_DOMAIN") ?? "cidoma.com").toLowerCase();
const RESEND_API_KEY = (Deno.env.get("RESEND_API_KEY") || "").replace(/[^\x20-\x7E]/g, "").trim();
const FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "سينا <no-reply@mail.cidoma.com>";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isAllowedOrigin = (origin: string | null) => {
  if (!origin) return false;
  try {
    const hostname = new URL(origin).hostname.toLowerCase();
    return hostname === allowedRootDomain || hostname.endsWith(`.${allowedRootDomain}`);
  } catch {
    return false;
  }
};

const buildCorsHeaders = (origin: string | null) => ({
  "Access-Control-Allow-Origin": isAllowedOrigin(origin) ? origin! : publicSiteUrl,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  Vary: "Origin",
});

const findAuthUserByEmail = async (
  adminClient: ReturnType<typeof createClient>,
  email: string,
) => {
  const normalized = email.trim().toLowerCase();
  let page = 1;
  const perPage = 200;
  while (page <= 10) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const found = data.users.find((u) => (u.email || "").toLowerCase() === normalized);
    if (found) return found;
    if (data.users.length < perPage) break;
    page += 1;
  }
  return null;
};

const inviteEmailHtml = (inviteUrl: string, fullName: string) => `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#f6f8fa;font-family:'Segoe UI',Tahoma,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f8fa;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(15,31,46,0.08);">
        <tr><td style="background:#0F1F2E;padding:28px 32px;">
          <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">سينا | مرحباً بك</h1>
          <p style="margin:6px 0 0;color:rgba(255,255,255,0.75);font-size:13px;">الفرصة القادمة تبدأ هنا</p>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 14px;color:#1E374B;font-size:16px;font-weight:600;">${fullName ? `مرحباً ${fullName},` : "مرحباً،"}</p>
          <p style="margin:0 0 18px;color:#374151;font-size:14px;line-height:1.9;">
            تم إنشاء حساب مالك باسمك على منصة <strong>سينا</strong>. لبدء استخدام حسابك، يرجى تعيين كلمة المرور من خلال الرابط أدناه:
          </p>
          <p style="text-align:center;margin:26px 0;">
            <a href="${inviteUrl}" style="display:inline-block;padding:14px 34px;background:#2B4C66;color:#fff;text-decoration:none;border-radius:12px;font-size:15px;font-weight:600;">تعيين كلمة المرور</a>
          </p>
          <p style="margin:18px 0 0;color:#6b7280;font-size:12px;line-height:1.8;">
            هذا الرابط صالح لفترة محدودة ولاستخدام واحد فقط. إن لم يعمل الزر، انسخ الرابط التالي إلى متصفحك:<br/>
            <span style="word-break:break-all;color:#2B4C66;">${inviteUrl}</span>
          </p>
        </td></tr>
        <tr><td style="background:#F7F9FB;padding:18px 32px;border-top:1px solid #e5e7eb;">
          <p style="margin:0;color:#6b7280;font-size:11px;line-height:1.7;text-align:center;">
            سينا للاستثمارات العقارية &middot; cidoma.com<br/>
            إذا لم تطلب هذا الحساب، يمكنك تجاهل هذه الرسالة بأمان.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

const sendInviteEmail = async (to: string, inviteUrl: string, fullName: string) => {
  if (!RESEND_API_KEY) {
    console.warn("RESEND_API_KEY missing; skipping email send");
    return { sent: false, reason: "no_api_key" };
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [to],
      subject: "سينا | تفعيل حسابك كمالك أرض",
      html: inviteEmailHtml(inviteUrl, fullName),
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    console.error("Resend error:", res.status, txt);
    return { sent: false, reason: "resend_failed", status: res.status };
  }
  return { sent: true };
};

Deno.serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const adminClient = createClient(supabaseUrl, serviceKey);
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: caller } } = await userClient.auth.getUser();
    if (!caller) throw new Error("Unauthorized");

    // High-control gate (admin/supervisor/specialist)
    const { data: hcResult } = await adminClient.rpc("is_high_control", { _user_id: caller.id });
    if (!hcResult) throw new Error("High control access required");

    // Per-admin rate limit — even privileged users shouldn't blast invites.
    // 30 invites / hour / admin covers real operational use; mass imports
    // should be batched separately.
    const inviteGate = await checkRateLimit(adminClient, {
      key: `invite-owner:admin:${caller.id}`,
      windowSeconds: 3600,
      maxHits: 30,
    });
    if (!inviteGate.allowed) return rateLimited(corsHeaders, 3600);

    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const fullName = String(body.full_name || "").trim();
    if (!emailRegex.test(email)) throw new Error("Valid email required");

    let userId: string | null = null;
    const existing = await findAuthUserByEmail(adminClient, email);

    if (existing) {
      userId = existing.id;
      // If user already has a password they're a normal active user — refuse.
      if (existing.last_sign_in_at) {
        throw new Error("User already active; cannot re-invite an existing account");
      }
    } else {
      const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
        email,
        email_confirm: false,
        user_metadata: { full_name: fullName, invited_as: "owner" },
      });
      if (createErr || !created.user) throw new Error(createErr?.message ?? "Unable to create user");
      userId = created.user.id;
    }

    // Assign owner role (idempotent — UNIQUE(user_id, role))
    const { error: roleErr } = await adminClient
      .from("user_roles")
      .upsert({ user_id: userId, role: "owner" }, { onConflict: "user_id,role" });
    if (roleErr && !String(roleErr.message).toLowerCase().includes("duplicate")) {
      throw roleErr;
    }

    // Generate one-time invite link → lands on /auth/set-password
    const redirectTo = `${publicSiteUrl}/auth/set-password`;
    const { data: linkData, error: linkErr } = await adminClient.auth.admin.generateLink({
      type: "invite",
      email,
      options: { redirectTo },
    });
    if (linkErr || !linkData?.properties?.action_link) {
      throw new Error(linkErr?.message ?? "Unable to generate invite link");
    }
    const inviteUrl = linkData.properties.action_link;

    // Send branded email via Resend
    const sendResult = await sendInviteEmail(email, inviteUrl, fullName);

    // Audit log
    await adminClient.from("audit_logs").insert({
      user_id: caller.id,
      user_email: caller.email || null,
      action: "owner.invite",
      entity_type: "user",
      entity_id: userId,
      details: { email, full_name: fullName, email_sent: sendResult.sent, reason: sendResult.reason || null },
    });

    return new Response(JSON.stringify({
      success: true,
      user_id: userId,
      email,
      email_sent: sendResult.sent,
      // Do NOT expose invite_url unless email sending failed — avoids leak vector.
      invite_url: sendResult.sent ? undefined : inviteUrl,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err: any) {
    console.error("invite-owner error:", err?.message);
    const safe = [
      "Missing authorization", "Unauthorized", "High control access required",
      "Valid email required", "User already active; cannot re-invite an existing account",
      "Unable to create user", "Unable to generate invite link",
    ];
    const message = safe.some((m) => err?.message?.includes(m)) ? err.message : "Operation failed";
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
