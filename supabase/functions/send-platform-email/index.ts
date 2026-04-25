import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
const publicSiteUrl = Deno.env.get("PUBLIC_SITE_URL") ?? "https://cidoma.com";
const allowedRootDomain = (Deno.env.get("ALLOWED_ROOT_DOMAIN") ?? "cidoma.com").toLowerCase();
const RESEND_API_KEY = (Deno.env.get("RESEND_API_KEY") || "").replace(/[^\x20-\x7E]/g, "").trim();
const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") ?? "";
const EMAIL_FROM = Deno.env.get("EMAIL_FROM") ?? "SYNA Platform <onboarding@resend.dev>";

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

/* ── Email templates ── */

interface EmailTemplate {
  subject: string;
  html: string;
  recipients: Array<{ email: string; user_id?: string }>;
}

const baseStyle = `<style>
  body { font-family: 'Segoe UI', sans-serif; background: #f8f9fa; margin: 0; padding: 0; direction: rtl; }
  .c { max-width: 600px; margin: 20px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.08); }
  .h { background: linear-gradient(135deg, #0d9488, #115e59); padding: 24px 30px; }
  .h h1 { color: #fff; margin: 0; font-size: 20px; font-weight: 600; }
  .h p { color: rgba(255,255,255,0.8); margin: 6px 0 0; font-size: 13px; }
  .b { padding: 30px; }
  .ib { background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 8px; padding: 16px; margin: 16px 0; }
  .f { background: #f8fafc; padding: 16px 30px; text-align: center; border-top: 1px solid #e2e8f0; }
  .f p { color: #94a3b8; font-size: 11px; margin: 0; }
  .btn { display: inline-block; background: #0d9488; color: #fff; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600; margin: 16px 0; }
</style>`;

const logo = `<div style="text-align:center;padding:16px 0 8px"><strong style="font-size:22px;color:#0d9488;">SYNA</strong></div>`;
const footer = `<div class="f"><p>SYNA Platform — منصة سينا للشراكات العقارية</p></div>`;

function buildTemplate(title: string, subtitle: string, bodyHtml: string): string {
  return `<!DOCTYPE html><html><head>${baseStyle}</head><body>
    <div class="c">${logo}
      <div class="h"><h1>${title}</h1><p>${subtitle}</p></div>
      <div class="b">${bodyHtml}</div>
      ${footer}
    </div>
  </body></html>`;
}

/* ── Event type → template builder ── */

async function buildEmailForEvent(
  adminClient: ReturnType<typeof createClient>,
  eventType: string,
  payload: Record<string, unknown>,
): Promise<EmailTemplate | null> {
  const requestId = payload.deal_request_id as string | undefined;

  // Fetch context if we have a request ID
  let ctx: any = {};
  if (requestId) {
    const { data } = await adminClient
      .from("deal_requests")
      .select("id, developer_id, land_id, current_phase, lands(city, district, owner_id), developers(company_name, marketing_brand_name, email, user_id)")
      .eq("id", requestId)
      .single();
    if (data) ctx = data;
  }

  const devEmail = ctx.developers?.email || "";
  const devName = ctx.developers?.marketing_brand_name || ctx.developers?.company_name || "المطور";
  const location = `${ctx.lands?.city || ""}${ctx.lands?.district ? ` - ${ctx.lands.district}` : ""}`;

  // Get owner email if needed
  let ownerEmail = "";
  let ownerUserId = "";
  if (ctx.lands?.owner_id) {
    ownerUserId = ctx.lands.owner_id;
    const { data: ownerAuth } = await adminClient.auth.admin.getUserById(ownerUserId);
    ownerEmail = ownerAuth?.user?.email || "";
  }

  const recipients: Array<{ email: string; user_id?: string }> = [];

  switch (eventType) {
    // ── Study events ──
    case "study_required":
      if (devEmail) recipients.push({ email: devEmail, user_id: ctx.developers?.user_id });
      return {
        subject: `SYNA | مطلوب دراسة جدوى - ${location}`,
        html: buildTemplate("📋 مطلوب دراسة جدوى", "يرجى رفع دراسة الجدوى",
          `<p style="color:#475569;font-size:14px;">مرحباً ${devName}،</p>
           <p style="color:#475569;font-size:14px;">المالك يطلب دراسة جدوى لأرض ${location}.</p>
           <a href="${publicSiteUrl}/crm/my-requests" class="btn">رفع الدراسة</a>`),
        recipients,
      };

    case "study_submitted":
      if (ownerEmail) recipients.push({ email: ownerEmail, user_id: ownerUserId });
      return {
        subject: `SYNA | تم رفع دراسة جدوى - ${location}`,
        html: buildTemplate("📄 دراسة جدوى جديدة", "المطور رفع دراسة الجدوى",
          `<p style="color:#475569;font-size:14px;">تم رفع دراسة جدوى من ${devName} لأرض ${location}.</p>
           <a href="${publicSiteUrl}/owner/requests" class="btn">مراجعة الدراسة</a>`),
        recipients,
      };

    case "study_approved":
    case "study_rejected":
    case "study_changes_requested": {
      if (devEmail) recipients.push({ email: devEmail, user_id: ctx.developers?.user_id });
      const studyStatus = eventType === "study_approved" ? "✅ مقبولة" : eventType === "study_rejected" ? "❌ مرفوضة" : "📝 تعديلات مطلوبة";
      return {
        subject: `SYNA | تحديث الدراسة - ${location}`,
        html: buildTemplate(studyStatus, `حالة الدراسة: ${studyStatus}`,
          `<p style="color:#475569;font-size:14px;">مرحباً ${devName}،</p>
           <p style="color:#475569;font-size:14px;">تم تحديث حالة دراسة الجدوى لأرض ${location}.</p>
           <div class="ib"><strong>الحالة:</strong> ${studyStatus}</div>
           <a href="${publicSiteUrl}/crm/my-requests" class="btn">عرض التفاصيل</a>`),
        recipients,
      };
    }

    // ── Meeting events ──
    case "meeting_proposed":
      if (devEmail) recipients.push({ email: devEmail, user_id: ctx.developers?.user_id });
      return {
        subject: `SYNA | اقتراح اجتماع - ${location}`,
        html: buildTemplate("📅 اقتراح اجتماع", "تم اقتراح موعد اجتماع",
          `<p style="color:#475569;font-size:14px;">مرحباً ${devName}،</p>
           <p style="color:#475569;font-size:14px;">تم اقتراح اجتماع بخصوص أرض ${location}.</p>
           <a href="${publicSiteUrl}/crm/my-requests" class="btn">عرض التفاصيل والتأكيد</a>`),
        recipients,
      };

    case "meeting_confirmed":
      if (ownerEmail) recipients.push({ email: ownerEmail, user_id: ownerUserId });
      return {
        subject: `SYNA | تأكيد الاجتماع - ${location}`,
        html: buildTemplate("✅ الاجتماع مؤكد", "المطور أكد حضوره",
          `<p style="color:#475569;font-size:14px;">تم تأكيد الاجتماع من ${devName} بخصوص أرض ${location}.</p>
           <a href="${publicSiteUrl}/owner/requests" class="btn">عرض التفاصيل</a>`),
        recipients,
      };

    case "meeting_cancelled":
      if (devEmail) recipients.push({ email: devEmail, user_id: ctx.developers?.user_id });
      if (ownerEmail) recipients.push({ email: ownerEmail, user_id: ownerUserId });
      return {
        subject: `SYNA | إلغاء الاجتماع - ${location}`,
        html: buildTemplate("❌ تم إلغاء الاجتماع", "تم إلغاء الاجتماع المجدول",
          `<p style="color:#475569;font-size:14px;">تم إلغاء الاجتماع بخصوص أرض ${location}.</p>`),
        recipients,
      };

    case "meeting_completed":
      if (devEmail) recipients.push({ email: devEmail, user_id: ctx.developers?.user_id });
      if (ownerEmail) recipients.push({ email: ownerEmail, user_id: ownerUserId });
      return {
        subject: `SYNA | اكتمال الاجتماع - ${location}`,
        html: buildTemplate("✅ تم عقد الاجتماع", "الاجتماع اكتمل بنجاح",
          `<p style="color:#475569;font-size:14px;">تم عقد الاجتماع بنجاح بخصوص أرض ${location}.</p>
           <p style="color:#475569;font-size:14px;">سيتم إصدار تقرير الاجتماع قريبًا.</p>`),
        recipients,
      };

    // ── Report events ──
    case "report_created":
      if (devEmail) recipients.push({ email: devEmail, user_id: ctx.developers?.user_id });
      if (ownerEmail) recipients.push({ email: ownerEmail, user_id: ownerUserId });
      return {
        subject: `SYNA | تقرير اجتماع يحتاج اعتمادك - ${location}`,
        html: buildTemplate("📋 تقرير اجتماع جديد", "مطلوب اعتمادك خلال 24 ساعة",
          `<p style="color:#475569;font-size:14px;">تم إصدار تقرير الاجتماع بخصوص أرض ${location}.</p>
           <div class="ib" style="border-color:#fbbf24;background:#fffbeb;">
             <strong style="color:#92400e;">⏰ مهلة 24 ساعة:</strong>
             <span style="color:#92400e;"> يرجى اعتماد أو رفض أو طلب تعديل التقرير خلال 24 ساعة.</span>
           </div>
           <a href="${publicSiteUrl}" class="btn">عرض التقرير واتخاذ القرار</a>`),
        recipients,
      };

    case "report_approved":
      if (devEmail) recipients.push({ email: devEmail, user_id: ctx.developers?.user_id });
      if (ownerEmail) recipients.push({ email: ownerEmail, user_id: ownerUserId });
      return {
        subject: `SYNA | تم اعتماد تقرير الاجتماع - ${location}`,
        html: buildTemplate("✅ تقرير الاجتماع معتمد", "تم الاعتماد من جميع الأطراف",
          `<p style="color:#475569;font-size:14px;">تم اعتماد تقرير الاجتماع بخصوص أرض ${location} من جميع الأطراف.</p>`),
        recipients,
      };

    case "report_rejected":
      if (devEmail) recipients.push({ email: devEmail, user_id: ctx.developers?.user_id });
      if (ownerEmail) recipients.push({ email: ownerEmail, user_id: ownerUserId });
      return {
        subject: `SYNA | رفض تقرير الاجتماع - ${location}`,
        html: buildTemplate("❌ تقرير الاجتماع مرفوض", "تم رفض التقرير",
          `<p style="color:#475569;font-size:14px;">تم رفض تقرير الاجتماع بخصوص أرض ${location}.</p>`),
        recipients,
      };

    case "report_changes_requested":
      if (devEmail) recipients.push({ email: devEmail, user_id: ctx.developers?.user_id });
      if (ownerEmail) recipients.push({ email: ownerEmail, user_id: ownerUserId });
      return {
        subject: `SYNA | تعديلات مطلوبة على تقرير الاجتماع - ${location}`,
        html: buildTemplate("📝 تعديلات مطلوبة", "تم طلب تعديلات على التقرير",
          `<p style="color:#475569;font-size:14px;">تم طلب تعديلات على تقرير الاجتماع بخصوص أرض ${location}.</p>`),
        recipients,
      };

    case "report_deadline_reminder":
      if (devEmail) recipients.push({ email: devEmail, user_id: ctx.developers?.user_id });
      if (ownerEmail) recipients.push({ email: ownerEmail, user_id: ownerUserId });
      return {
        subject: `SYNA | ⏰ تذكير: مهلة اعتماد التقرير تنتهي قريبًا - ${location}`,
        html: buildTemplate("⏰ تذكير عاجل", "مهلة الاعتماد تنتهي خلال ساعتين",
          `<p style="color:#475569;font-size:14px;">تنبيه: مهلة اعتماد تقرير الاجتماع بخصوص أرض ${location} تنتهي خلال ساعتين فقط.</p>
           <div class="ib" style="border-color:#ef4444;background:#fef2f2;">
             <strong style="color:#991b1b;">⚠️ إذا لم يتم الاعتماد، سينتهي التقرير تلقائيًا.</strong>
           </div>
           <a href="${publicSiteUrl}" class="btn" style="background:#ef4444;">اعتمد الآن</a>`),
        recipients,
      };

    case "report_expired":
      if (devEmail) recipients.push({ email: devEmail, user_id: ctx.developers?.user_id });
      if (ownerEmail) recipients.push({ email: ownerEmail, user_id: ownerUserId });
      if (ADMIN_EMAIL) recipients.push({ email: ADMIN_EMAIL });
      return {
        subject: `SYNA | انتهت مهلة اعتماد التقرير - ${location}`,
        html: buildTemplate("⏰ انتهت المهلة", "مهلة الاعتماد 24 ساعة انتهت",
          `<p style="color:#475569;font-size:14px;">انتهت مهلة 24 ساعة لاعتماد تقرير الاجتماع بخصوص أرض ${location} بدون اعتماد كامل.</p>`),
        recipients,
      };

    // ── NDA events ──
    case "nda_developer_accepted":
      if (ownerEmail) recipients.push({ email: ownerEmail, user_id: ownerUserId });
      return {
        subject: `SYNA | المطور وافق على NDA - ${location}`,
        html: buildTemplate("🔒 موافقة NDA", "المطور وافق على اتفاقية عدم الإفصاح",
          `<p style="color:#475569;font-size:14px;">${devName} وافق على اتفاقية عدم الإفصاح لأرض ${location}.</p>
           <p style="color:#475569;font-size:14px;">بانتظار موافقتك لإكمال الاتفاقية.</p>
           <a href="${publicSiteUrl}/owner/requests" class="btn">مراجعة واعتماد</a>`),
        recipients,
      };

    case "nda_owner_accepted":
      if (devEmail) recipients.push({ email: devEmail, user_id: ctx.developers?.user_id });
      return {
        subject: `SYNA | اكتملت اتفاقية NDA - ${location}`,
        html: buildTemplate("✅ NDA مكتمل", "اتفاقية عدم الإفصاح مكتملة",
          `<p style="color:#475569;font-size:14px;">مرحباً ${devName}،</p>
           <p style="color:#475569;font-size:14px;">اكتملت اتفاقية عدم الإفصاح لأرض ${location}. طلبك الآن قيد المراجعة.</p>`),
        recipients,
      };

    case "request_rejected":
    case "request_cancelled": {
      if (devEmail) recipients.push({ email: devEmail, user_id: ctx.developers?.user_id });
      const statusText = eventType === "request_rejected" ? "تم رفض طلبك" : "تم إلغاء الطلب";
      return {
        subject: `SYNA | ${statusText} - ${location}`,
        html: buildTemplate(`❌ ${statusText}`, statusText,
          `<p style="color:#475569;font-size:14px;">مرحباً ${devName}،</p>
           <p style="color:#475569;font-size:14px;">${statusText} بخصوص أرض ${location}.</p>`),
        recipients,
      };
    }

    // ── Negotiation events ──
    case "negotiation_new_round":
      if (devEmail) recipients.push({ email: devEmail, user_id: ctx.developers?.user_id });
      if (ownerEmail) recipients.push({ email: ownerEmail, user_id: ownerUserId });
      return {
        subject: `SYNA | عرض تفاوض جديد - ${location}`,
        html: buildTemplate("💬 عرض تفاوض جديد", "تم تقديم عرض تفاوض جديد",
          `<p style="color:#475569;font-size:14px;">تم تقديم عرض تفاوض جديد بخصوص أرض ${location}.</p>
           <a href="${publicSiteUrl}" class="btn">عرض التفاصيل والرد</a>`),
        recipients,
      };

    case "negotiation_accepted":
      if (devEmail) recipients.push({ email: devEmail, user_id: ctx.developers?.user_id });
      if (ownerEmail) recipients.push({ email: ownerEmail, user_id: ownerUserId });
      return {
        subject: `SYNA | تم قبول العرض - ${location}`,
        html: buildTemplate("✅ تم قبول العرض", "تم قبول عرض التفاوض",
          `<p style="color:#475569;font-size:14px;">تم قبول عرض التفاوض بخصوص أرض ${location}. الصفقة في مرحلة الاعتماد النهائي.</p>`),
        recipients,
      };

    case "negotiation_rejected":
      if (devEmail) recipients.push({ email: devEmail, user_id: ctx.developers?.user_id });
      if (ownerEmail) recipients.push({ email: ownerEmail, user_id: ownerUserId });
      return {
        subject: `SYNA | تم رفض العرض - ${location}`,
        html: buildTemplate("❌ تم رفض العرض", "تم رفض عرض التفاوض",
          `<p style="color:#475569;font-size:14px;">تم رفض عرض التفاوض بخصوص أرض ${location}.</p>`),
        recipients,
      };

    case "negotiation_counter_offer":
      if (devEmail) recipients.push({ email: devEmail, user_id: ctx.developers?.user_id });
      if (ownerEmail) recipients.push({ email: ownerEmail, user_id: ownerUserId });
      return {
        subject: `SYNA | عرض مضاد - ${location}`,
        html: buildTemplate("🔄 عرض مضاد", "تم تقديم عرض مضاد",
          `<p style="color:#475569;font-size:14px;">تم تقديم عرض مضاد بخصوص أرض ${location}. يرجى مراجعة العرض والرد.</p>
           <a href="${publicSiteUrl}" class="btn">عرض التفاصيل والرد</a>`),
        recipients,
      };

    // ── Deal closing events ──
    case "deal_closed_won":
      if (devEmail) recipients.push({ email: devEmail, user_id: ctx.developers?.user_id });
      if (ownerEmail) recipients.push({ email: ownerEmail, user_id: ownerUserId });
      if (ADMIN_EMAIL) recipients.push({ email: ADMIN_EMAIL });
      return {
        subject: `SYNA | 🎉 صفقة ناجحة - ${location}`,
        html: buildTemplate("🏆 صفقة ناجحة!", "تم إغلاق الصفقة بنجاح",
          `<p style="color:#475569;font-size:14px;">مبارك! تم إغلاق الصفقة بنجاح بخصوص أرض ${location}.</p>
           <div class="ib" style="border-color:#10b981;background:#ecfdf5;">
             <strong style="color:#065f46;">✅ تم توثيق الاتفاق وتسجيل تفاصيل العمولة.</strong>
           </div>`),
        recipients,
      };

    case "deal_closed_lost":
      if (devEmail) recipients.push({ email: devEmail, user_id: ctx.developers?.user_id });
      if (ownerEmail) recipients.push({ email: ownerEmail, user_id: ownerUserId });
      if (ADMIN_EMAIL) recipients.push({ email: ADMIN_EMAIL });
      return {
        subject: `SYNA | صفقة مغلقة - ${location}`,
        html: buildTemplate("❌ صفقة مغلقة", "تم إغلاق الصفقة بدون اتفاق",
          `<p style="color:#475569;font-size:14px;">تم إغلاق الصفقة بخصوص أرض ${location} بدون اتفاق.</p>`),
        recipients,
      };

    default:
      return null;
  }
}

/* ── Send via Resend + log ── */

async function sendAndLog(
  adminClient: ReturnType<typeof createClient>,
  eventType: string,
  template: EmailTemplate,
  relatedEntityType?: string,
  relatedEntityId?: string,
) {
  for (const recipient of template.recipients) {
    if (!recipient.email) continue;

    // Log the email
    const logEntry = {
      event_type: eventType,
      recipient_email: recipient.email,
      recipient_user_id: recipient.user_id || null,
      subject: template.subject,
      body_preview: template.subject,
      status: "queued",
      attempts: 0,
      related_entity_type: relatedEntityType || null,
      related_entity_id: relatedEntityId || null,
    };

    const { data: logRow } = await adminClient
      .from("email_log")
      .insert(logEntry)
      .select("id")
      .single();

    const logId = logRow?.id;

    // Send via Resend
    if (RESEND_API_KEY) {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: EMAIL_FROM,
            to: [recipient.email],
            subject: template.subject,
            html: template.html,
          }),
        });

        if (res.ok) {
          if (logId) {
            await adminClient.from("email_log").update({
              status: "sent",
              attempts: 1,
              last_attempt_at: new Date().toISOString(),
            }).eq("id", logId);
          }
        } else {
          const errText = await res.text();
          if (logId) {
            await adminClient.from("email_log").update({
              status: "failed",
              attempts: 1,
              last_attempt_at: new Date().toISOString(),
              error: errText.substring(0, 500),
            }).eq("id", logId);
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        if (logId) {
          await adminClient.from("email_log").update({
            status: "failed",
            attempts: 1,
            last_attempt_at: new Date().toISOString(),
            error: msg.substring(0, 500),
          }).eq("id", logId);
        }
      }
    } else {
      // No Resend key — mark as sent (logged only)
      console.warn("No RESEND_API_KEY, email logged but not sent");
      if (logId) {
        await adminClient.from("email_log").update({
          status: "sent",
          attempts: 1,
          last_attempt_at: new Date().toISOString(),
          error: "NO_RESEND_KEY: logged only",
        }).eq("id", logId);
      }
    }
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
    // ── Admin-only OR trusted-internal auth check ──
    // Two valid auth paths:
    //   (a) admin JWT  — user with role='admin' invoking from the app
    //   (b) CRON_SECRET — internal cron jobs (check-report-deadlines,
    //       email-retry-cron) that run as service role. Without this,
    //       those cron invocations silently 403 because auth.getUser()
    //       on a service_role token has no user_roles row.
    const adminClient = createClient(supabaseUrl, serviceKey);
    const cronSecret = Deno.env.get("CRON_SECRET") || "";
    const providedCronSecret = req.headers.get("x-cron-secret") || "";
    const isTrustedInternal = !!cronSecret && providedCronSecret === cronSecret;

    if (!isTrustedInternal) {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        return new Response(JSON.stringify({ error: "Missing authorization" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user: caller } } = await userClient.auth.getUser();
      if (!caller) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: roleData } = await adminClient
        .from("user_roles")
        .select("role")
        .eq("user_id", caller.id)
        .eq("role", "admin")
        .maybeSingle();
      if (!roleData) {
        return new Response(JSON.stringify({ error: "Admin access required" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }
    // ── End auth check ──

    const payload = await req.json();
    const eventType = String(payload.event_type || "").trim();

    if (!eventType) throw new Error("event_type is required");

    const template = await buildEmailForEvent(adminClient, eventType, payload);
    if (!template) {
      return new Response(JSON.stringify({ success: true, message: "No template for event type" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (template.recipients.length === 0) {
      return new Response(JSON.stringify({ success: true, message: "No recipients" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await sendAndLog(
      adminClient,
      eventType,
      template,
      payload.deal_request_id ? "deal_request" : (payload.report_id ? "report" : undefined),
      payload.deal_request_id || payload.report_id || undefined,
    );

    return new Response(JSON.stringify({
      success: true,
      sent_to: template.recipients.length,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[send-platform-email] Error:", message);
    return new Response(JSON.stringify({ error: "Email operation failed" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
