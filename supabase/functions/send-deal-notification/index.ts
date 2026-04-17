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

function escapeHtml(str: string | undefined | null): string {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function sanitizeUrl(raw: string | undefined | null): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw.trim());
    if (url.protocol === "https:" || url.protocol === "http:") return url.href;
    return null;
  } catch {
    return null;
  }
}

type NotificationType =
  | "request_submitted"
  | "request_approved"
  | "request_rejected"
  | "meeting_scheduled"
  | "new_owner_registered"
  | "new_developer_registered"
  | "deal_stage_changed"
  | "draft_created_for_owner"
  | "proposal_received"
  | "proposal_viewed"
  | "developer_selected"
  | "developer_not_selected";

interface NotificationPayload {
  type: NotificationType;
  request_id?: string;
  deal_id?: string;
  meeting_date?: string;
  meeting_time?: string;
  meeting_link?: string;
  reject_reason?: string;
  developer_name?: string;
  developer_email?: string;
  developer_user_id?: string;
  owner_name?: string;
  owner_email?: string;
  owner_user_id?: string;
  land_city?: string;
  land_district?: string;
  registered_name?: string;
  registered_email?: string;
  registered_phone?: string;
  from_stage?: string;
  to_stage?: string;
  stage_notes?: string;
}

const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") ?? "";
if (!ADMIN_EMAIL) {
  console.error("ADMIN_EMAIL env var is not configured");
}

const stageLabelsAr: Record<string, string> = {
  listed: "مُدرجة",
  request_submitted: "طلب مقدم",
  owner_review: "مراجعة المالك",
  owner_approved: "موافقة مبدئية",
  meeting_scheduled: "اجتماع مجدول",
  strategy_defined: "استراتيجية محددة",
  documents_exchanged: "تبادل مستندات",
  agreements_prepared: "إعداد اتفاقيات",
  deal_closed: "مُغلقة",
  deal_cancelled: "ملغاة",
};

function buildEmailHtml(payload: NotificationPayload): { subject: string; html: string; to: string } {
  const { type } = payload;
  const location = `${payload.land_city || ""}${payload.land_district ? ` - ${payload.land_district}` : ""}`;

  const baseStyle = `
    <style>
      body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #f8f9fa; margin: 0; padding: 0; direction: rtl; }
      .container { max-width: 600px; margin: 20px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.08); }
      .header { background: linear-gradient(135deg, #0d9488, #115e59); padding: 24px 30px; }
      .header h1 { color: #fff; margin: 0; font-size: 20px; font-weight: 600; }
      .header p { color: rgba(255,255,255,0.8); margin: 6px 0 0; font-size: 13px; }
      .body { padding: 30px; }
      .info-box { background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 8px; padding: 16px; margin: 16px 0; }
      .info-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
      .info-row:last-child { border-bottom: none; }
      .info-label { color: #64748b; font-weight: 500; }
      .info-value { color: #1e293b; }
      .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
      .badge-success { background: #dcfce7; color: #166534; }
      .badge-danger { background: #fee2e2; color: #991b1b; }
      .badge-info { background: #dbeafe; color: #1e40af; }
      .badge-warning { background: #fef3c7; color: #92400e; }
      .footer { background: #f8fafc; padding: 16px 30px; text-align: center; border-top: 1px solid #e2e8f0; }
      .footer p { color: #94a3b8; font-size: 11px; margin: 0; }
      .logo { text-align: center; padding: 16px 0 8px; }
      .logo img { height: 40px; }
    </style>
  `;

  const logoHtml = `<div class="logo"><strong style="font-size:22px;color:#0d9488;">SYNA</strong></div>`;

  switch (type) {
    case "request_submitted":
      return {
        to: payload.owner_email || ADMIN_EMAIL,
        subject: `SYNA | طلب شراكة جديد - ${location}`,
        html: `<!DOCTYPE html><html><head>${baseStyle}</head><body>
          <div class="container">${logoHtml}
            <div class="header"><h1>🔔 طلب شراكة جديد</h1><p>تم تقديم طلب شراكة على أرضك</p></div>
            <div class="body">
              <p style="color:#475569;font-size:14px;">مرحباً ${payload.owner_name || "مالك الأرض"}،</p>
              <p style="color:#475569;font-size:14px;">تم تقديم طلب شراكة جديد على أرضك من مطور عقاري.</p>
              <div class="info-box">
                <div class="info-row"><span class="info-label">المطور:</span><span class="info-value">${payload.developer_name || "—"}</span></div>
                <div class="info-row"><span class="info-label">الموقع:</span><span class="info-value">${location}</span></div>
              </div>
              <p style="color:#64748b;font-size:13px;">سجّل دخولك إلى المنصة لمراجعة الطلب واتخاذ القرار.</p>
            </div>
            <div class="footer"><p>SYNA Platform — منصة سينا للشراكات العقارية</p></div>
          </div>
        </body></html>`,
      };

    case "request_approved":
      return {
        to: payload.developer_email || "",
        subject: `SYNA | تمت الموافقة على طلبك - ${location}`,
        html: `<!DOCTYPE html><html><head>${baseStyle}</head><body>
          <div class="container">${logoHtml}
            <div class="header"><h1>✅ تمت الموافقة على طلبك</h1><p>أخبار رائعة!</p></div>
            <div class="body">
              <p style="color:#475569;font-size:14px;">مرحباً ${payload.developer_name || "المطور"}،</p>
              <p style="color:#475569;font-size:14px;">تمت الموافقة على طلب الشراكة الخاص بك.</p>
              <div class="info-box">
                <div class="info-row"><span class="info-label">الموقع:</span><span class="info-value">${location}</span></div>
                <div class="info-row"><span class="info-label">الحالة:</span><span class="info-value"><span class="badge badge-success">تمت الموافقة</span></span></div>
              </div>
            </div>
            <div class="footer"><p>SYNA Platform — منصة سينا للشراكات العقارية</p></div>
          </div>
        </body></html>`,
      };

    case "request_rejected":
      return {
        to: payload.developer_email || "",
        subject: `SYNA | تم رفض طلبك - ${location}`,
        html: `<!DOCTYPE html><html><head>${baseStyle}</head><body>
          <div class="container">${logoHtml}
            <div class="header" style="background:linear-gradient(135deg,#dc2626,#991b1b);"><h1>❌ تم رفض الطلب</h1><p>نأسف</p></div>
            <div class="body">
              <p style="color:#475569;font-size:14px;">مرحباً ${payload.developer_name || "المطور"}،</p>
              <p style="color:#475569;font-size:14px;">تم رفض طلب الشراكة الخاص بك.</p>
              <div class="info-box">
                <div class="info-row"><span class="info-label">الموقع:</span><span class="info-value">${location}</span></div>
                ${payload.reject_reason ? `<div class="info-row"><span class="info-label">السبب:</span><span class="info-value">${payload.reject_reason}</span></div>` : ""}
              </div>
            </div>
            <div class="footer"><p>SYNA Platform — منصة سينا للشراكات العقارية</p></div>
          </div>
        </body></html>`,
      };

    case "meeting_scheduled":
      return {
        to: ADMIN_EMAIL,
        subject: `SYNA | اجتماع جديد - ${location}`,
        html: `<!DOCTYPE html><html><head>${baseStyle}</head><body>
          <div class="container">${logoHtml}
            <div class="header" style="background:linear-gradient(135deg,#2563eb,#1e40af);"><h1>📅 اجتماع جديد</h1><p>تم جدولة اجتماع</p></div>
            <div class="body">
              <p style="color:#475569;font-size:14px;">مرحباً مدير النظام،</p>
              <div class="info-box">
                <div class="info-row"><span class="info-label">الموقع:</span><span class="info-value">${location}</span></div>
                <div class="info-row"><span class="info-label">المالك:</span><span class="info-value">${payload.owner_name || "—"}</span></div>
                <div class="info-row"><span class="info-label">المطور:</span><span class="info-value">${payload.developer_name || "—"}</span></div>
                <div class="info-row"><span class="info-label">التاريخ:</span><span class="info-value">${payload.meeting_date || "—"}</span></div>
                <div class="info-row"><span class="info-label">الوقت:</span><span class="info-value">${payload.meeting_time || "—"}</span></div>
                ${(() => { const safeLink = sanitizeUrl(payload.meeting_link); return safeLink ? `<div class="info-row"><span class="info-label">الرابط:</span><span class="info-value"><a href="${escapeHtml(safeLink)}" style="color:#0d9488;">${escapeHtml(safeLink)}</a></span></div>` : ""; })()}
              </div>
            </div>
            <div class="footer"><p>SYNA Platform — منصة سينا للشراكات العقارية</p></div>
          </div>
        </body></html>`,
      };

    case "proposal_received":
      return {
        to: payload.owner_email || ADMIN_EMAIL,
        subject: `SYNA | تم استلام عرض جديد - ${location}`,
        html: `<!DOCTYPE html><html><head>${baseStyle}</head><body>
          <div class="container">${logoHtml}
            <div class="header"><h1>📄 تم استلام عرض جديد</h1><p>مطور قدّم دراسته على أرضك</p></div>
            <div class="body">
              <p style="color:#475569;font-size:14px;">مرحباً ${payload.owner_name || "مالك الأرض"}،</p>
              <p style="color:#475569;font-size:14px;">قام المطور <strong>${payload.developer_name || "—"}</strong> بتقديم دراسته على أرضك في ${location}.</p>
              <div class="info-box">
                <div class="info-row"><span class="info-label">المطور:</span><span class="info-value">${payload.developer_name || "—"}</span></div>
                <div class="info-row"><span class="info-label">الموقع:</span><span class="info-value">${location}</span></div>
                <div class="info-row"><span class="info-label">الحالة:</span><span class="info-value"><span class="badge badge-info">تم استلام العرض</span></span></div>
              </div>
              <p style="color:#64748b;font-size:13px;">سجّل دخولك إلى المنصة لمراجعة العرض.</p>
            </div>
            <div class="footer"><p>SYNA Platform — منصة سينا للشراكات العقارية</p></div>
          </div>
        </body></html>`,
      };

    case "proposal_viewed":
      return {
        to: payload.developer_email || "",
        subject: `SYNA | المالك اطّلع على عرضك - ${location}`,
        html: `<!DOCTYPE html><html><head>${baseStyle}</head><body>
          <div class="container">${logoHtml}
            <div class="header" style="background:linear-gradient(135deg,#d97706,#92400e);"><h1>👁️ تمت المعاينة</h1><p>المالك اطّلع على عرضك</p></div>
            <div class="body">
              <p style="color:#475569;font-size:14px;">مرحباً ${payload.developer_name || "المطور"}،</p>
              <p style="color:#475569;font-size:14px;">قام مالك الأرض في ${location} بمراجعة عرضك. سيتم إعلامك بالقرار قريباً.</p>
              <div class="info-box">
                <div class="info-row"><span class="info-label">الموقع:</span><span class="info-value">${location}</span></div>
                <div class="info-row"><span class="info-label">الحالة:</span><span class="info-value"><span class="badge badge-warning">جاري المراجعة والرد</span></span></div>
              </div>
            </div>
            <div class="footer"><p>SYNA Platform — منصة سينا للشراكات العقارية</p></div>
          </div>
        </body></html>`,
      };

    case "developer_selected":
      return {
        to: payload.developer_email || "",
        subject: `SYNA | 🎉 تم اختياركم - ${location}`,
        html: `<!DOCTYPE html><html><head>${baseStyle}</head><body>
          <div class="container">${logoHtml}
            <div class="header" style="background:linear-gradient(135deg,#059669,#047857);"><h1>🎉 تم اختياركم!</h1><p>مبروك — تم اختياركم كمطور لهذه الفرصة</p></div>
            <div class="body">
              <p style="color:#475569;font-size:14px;">مرحباً ${payload.developer_name || "المطور"}،</p>
              <p style="color:#475569;font-size:14px;">يسعدنا إبلاغكم بأنه تم اختياركم كمطور للفرصة في ${location}. المرحلة التالية هي التفاوض على تفاصيل الشراكة.</p>
              <div class="info-box">
                <div class="info-row"><span class="info-label">الموقع:</span><span class="info-value">${location}</span></div>
                <div class="info-row"><span class="info-label">الحالة:</span><span class="info-value"><span class="badge badge-success">مطور مختار ✓</span></span></div>
              </div>
            </div>
            <div class="footer"><p>SYNA Platform — منصة سينا للشراكات العقارية</p></div>
          </div>
        </body></html>`,
      };

    case "developer_not_selected":
      return {
        to: payload.developer_email || "",
        subject: `SYNA | لم يتم اختياركم - ${location}`,
        html: `<!DOCTYPE html><html><head>${baseStyle}</head><body>
          <div class="container">${logoHtml}
            <div class="header" style="background:linear-gradient(135deg,#6b7280,#4b5563);"><h1>إشعار</h1><p>نتيجة تقييم طلبكم</p></div>
            <div class="body">
              <p style="color:#475569;font-size:14px;">مرحباً ${payload.developer_name || "المطور"}،</p>
              <p style="color:#475569;font-size:14px;">نشكركم على تقديمكم على الفرصة في ${location}. للأسف لم يتم اختياركم هذه المرة. نتطلع للتعاون معكم في فرص أخرى.</p>
              <div class="info-box">
                <div class="info-row"><span class="info-label">الموقع:</span><span class="info-value">${location}</span></div>
              </div>
            </div>
            <div class="footer"><p>SYNA Platform — منصة سينا للشراكات العقارية</p></div>
          </div>
        </body></html>`,
      };

    case "new_owner_registered":
      return {
        to: ADMIN_EMAIL,
        subject: `SYNA | مالك أرض جديد - ${payload.registered_name || payload.registered_email || ""}`,
        html: `<!DOCTYPE html><html><head>${baseStyle}</head><body>
          <div class="container">${logoHtml}
            <div class="header" style="background:linear-gradient(135deg,#7c3aed,#5b21b6);"><h1>👤 تسجيل مالك أرض جديد</h1><p>تم إنشاء حساب مالك أرض جديد</p></div>
            <div class="body">
              <p style="color:#475569;font-size:14px;">مرحباً مدير النظام،</p>
              <div class="info-box">
                <div class="info-row"><span class="info-label">الاسم:</span><span class="info-value">${payload.registered_name || "—"}</span></div>
                <div class="info-row"><span class="info-label">البريد:</span><span class="info-value">${payload.registered_email || "—"}</span></div>
                ${payload.registered_phone ? `<div class="info-row"><span class="info-label">الجوال:</span><span class="info-value">${payload.registered_phone}</span></div>` : ""}
              </div>
            </div>
            <div class="footer"><p>SYNA Platform — منصة سينا للشراكات العقارية</p></div>
          </div>
        </body></html>`,
      };

    case "new_developer_registered":
      return {
        to: ADMIN_EMAIL,
        subject: `SYNA | مطور عقاري جديد - ${payload.registered_name || ""}`,
        html: `<!DOCTYPE html><html><head>${baseStyle}</head><body>
          <div class="container">${logoHtml}
            <div class="header" style="background:linear-gradient(135deg,#ea580c,#c2410c);"><h1>🏗️ تسجيل مطور عقاري جديد</h1><p>مطور جديد بانتظار التوثيق</p></div>
            <div class="body">
              <p style="color:#475569;font-size:14px;">مرحباً مدير النظام،</p>
              <div class="info-box">
                <div class="info-row"><span class="info-label">اسم الشركة:</span><span class="info-value">${payload.registered_name || "—"}</span></div>
                <div class="info-row"><span class="info-label">البريد:</span><span class="info-value">${payload.registered_email || "—"}</span></div>
                ${payload.registered_phone ? `<div class="info-row"><span class="info-label">الجوال:</span><span class="info-value">${payload.registered_phone}</span></div>` : ""}
              </div>
            </div>
            <div class="footer"><p>SYNA Platform — منصة سينا للشراكات العقارية</p></div>
          </div>
        </body></html>`,
      };

    case "deal_stage_changed":
      return {
        to: ADMIN_EMAIL,
        subject: `SYNA | تحديث مرحلة صفقة - ${payload.developer_name || ""} / ${location}`,
        html: `<!DOCTYPE html><html><head>${baseStyle}</head><body>
          <div class="container">${logoHtml}
            <div class="header" style="background:linear-gradient(135deg,#0891b2,#155e75);"><h1>📋 تحديث مرحلة صفقة</h1><p>تم تغيير مرحلة الصفقة</p></div>
            <div class="body">
              <p style="color:#475569;font-size:14px;">مرحباً مدير النظام،</p>
              <div class="info-box">
                <div class="info-row"><span class="info-label">المطور:</span><span class="info-value">${payload.developer_name || "—"}</span></div>
                <div class="info-row"><span class="info-label">الموقع:</span><span class="info-value">${location}</span></div>
                <div class="info-row"><span class="info-label">من مرحلة:</span><span class="info-value"><span class="badge badge-warning">${stageLabelsAr[payload.from_stage || ""] || payload.from_stage || "—"}</span></span></div>
                <div class="info-row"><span class="info-label">إلى مرحلة:</span><span class="info-value"><span class="badge badge-info">${stageLabelsAr[payload.to_stage || ""] || payload.to_stage || "—"}</span></span></div>
                ${payload.stage_notes ? `<div class="info-row"><span class="info-label">ملاحظات:</span><span class="info-value">${payload.stage_notes}</span></div>` : ""}
              </div>
            </div>
            <div class="footer"><p>SYNA Platform — منصة سينا للشراكات العقارية</p></div>
          </div>
        </body></html>`,
      };

    case "draft_created_for_owner":
      return {
        to: payload.owner_email || "",
        subject: `SYNA | تمت إضافة أرض جديدة بانتظار مراجعتك - ${location}`,
        html: `<!DOCTYPE html><html><head>${baseStyle}</head><body>
          <div class="container">${logoHtml}
            <div class="header" style="background:linear-gradient(135deg,#7c3aed,#5b21b6);"><h1>📋 أرض جديدة بانتظار مراجعتك</h1><p>تم إدراج أرض نيابةً عنك</p></div>
            <div class="body">
              <p style="color:#475569;font-size:14px;">مرحباً ${payload.owner_name || "مالك الأرض"}،</p>
              <p style="color:#475569;font-size:14px;">قامت إدارة المنصة بإدراج أرض جديدة نيابةً عنك. يرجى تسجيل الدخول لمراجعة البيانات واعتمادها.</p>
              <div class="info-box">
                <div class="info-row"><span class="info-label">الموقع:</span><span class="info-value">${location}</span></div>
                <div class="info-row"><span class="info-label">الحالة:</span><span class="info-value"><span class="badge badge-warning">مسودة — بانتظار مراجعتك</span></span></div>
              </div>
            </div>
            <div class="footer"><p>SYNA Platform — منصة سينا للشراكات العقارية</p></div>
          </div>
        </body></html>`,
      };

    default:
      return { to: ADMIN_EMAIL, subject: "SYNA Notification", html: "<p>Notification</p>" };
  }
}

async function createInAppNotification(
  supabaseAdmin: any,
  userId: string,
  type: string,
  titleAr: string,
  titleEn: string,
  messageAr: string,
  messageEn: string,
  entityType?: string,
  entityId?: string
) {
  try {
    await supabaseAdmin.from("notifications").insert({
      user_id: userId,
      type,
      title_ar: titleAr,
      title_en: titleEn,
      message_ar: messageAr,
      message_en: messageEn,
      entity_type: entityType || null,
      entity_id: entityId || null,
    });
  } catch (e) {
    console.error("Failed to create in-app notification:", e);
  }
}

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    // ── Role-based authorization ──
    const { data: adminRole } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    const isAdmin = !!adminRole;

    const payload: NotificationPayload = await req.json();

    if (!payload.type) {
      return new Response(JSON.stringify({ error: "Missing notification type" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // ── Authorization: non-admin users must be a party to the deal ──
    if (!isAdmin) {
      const callerIsParty =
        (payload.developer_user_id && payload.developer_user_id === user.id) ||
        (payload.owner_user_id && payload.owner_user_id === user.id);
      if (!callerIsParty) {
        return new Response(JSON.stringify({ error: "Forbidden: you are not a party to this deal" }), {
          status: 403,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    }

    // Sanitize all string fields
    const sanitizedPayload: NotificationPayload = {
      ...payload,
      developer_name: escapeHtml(payload.developer_name),
      developer_email: payload.developer_email,
      owner_name: escapeHtml(payload.owner_name),
      owner_email: payload.owner_email,
      land_city: escapeHtml(payload.land_city),
      land_district: escapeHtml(payload.land_district),
      reject_reason: escapeHtml(payload.reject_reason),
      registered_name: escapeHtml(payload.registered_name),
      registered_email: payload.registered_email,
      registered_phone: escapeHtml(payload.registered_phone),
      stage_notes: escapeHtml(payload.stage_notes),
      from_stage: payload.from_stage,
      to_stage: payload.to_stage,
      meeting_link: payload.meeting_link,
    };

    // Get admin user IDs for in-app notifications
    const { data: adminRoles } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");
    const adminUserIds = (adminRoles || []).map((r: any) => r.user_id);

    // In-app notification mapping
    const notifMap: Record<string, { titleAr: string; titleEn: string; msgAr: string; msgEn: string; entityType?: string; targetUserIds?: string[] }> = {
      new_owner_registered: {
        titleAr: "مالك أرض جديد",
        titleEn: "New Land Owner",
        msgAr: `تم تسجيل مالك أرض جديد: ${sanitizedPayload.registered_name || sanitizedPayload.registered_email || ""}`,
        msgEn: `New land owner registered: ${sanitizedPayload.registered_name || sanitizedPayload.registered_email || ""}`,
        entityType: "owner",
      },
      new_developer_registered: {
        titleAr: "مطور عقاري جديد",
        titleEn: "New Developer",
        msgAr: `تم تسجيل مطور جديد: ${sanitizedPayload.registered_name || ""} — بانتظار التوثيق`,
        msgEn: `New developer registered: ${sanitizedPayload.registered_name || ""} — awaiting verification`,
        entityType: "developer",
      },
      deal_stage_changed: {
        titleAr: "تحديث مرحلة صفقة",
        titleEn: "Deal Stage Updated",
        msgAr: `صفقة ${sanitizedPayload.developer_name || ""} / ${sanitizedPayload.land_city || ""}: ${stageLabelsAr[sanitizedPayload.from_stage || ""] || ""} → ${stageLabelsAr[sanitizedPayload.to_stage || ""] || ""}`,
        msgEn: `Deal ${sanitizedPayload.developer_name || ""} / ${sanitizedPayload.land_city || ""}: ${sanitizedPayload.from_stage || ""} → ${sanitizedPayload.to_stage || ""}`,
        entityType: "deal",
      },
      request_submitted: {
        titleAr: "طلب شراكة جديد",
        titleEn: "New Partnership Request",
        msgAr: `طلب شراكة جديد من ${sanitizedPayload.developer_name || ""} على أرض في ${sanitizedPayload.land_city || ""}`,
        msgEn: `New request from ${sanitizedPayload.developer_name || ""} for land in ${sanitizedPayload.land_city || ""}`,
        entityType: "deal_request",
      },
      draft_created_for_owner: {
        titleAr: "أرض جديدة بانتظار مراجعتك",
        titleEn: "New Land Awaiting Your Review",
        msgAr: `تم إدراج أرض في ${sanitizedPayload.land_city || ""} نيابةً عنك. يرجى المراجعة والاعتماد.`,
        msgEn: `A land in ${sanitizedPayload.land_city || ""} was added on your behalf. Please review and approve.`,
        entityType: "land",
      },
      proposal_received: {
        titleAr: "تم استلام عرض جديد",
        titleEn: "New Proposal Received",
        msgAr: `قام المطور ${sanitizedPayload.developer_name || ""} بتقديم دراسته على أرضك في ${sanitizedPayload.land_city || ""}`,
        msgEn: `Developer ${sanitizedPayload.developer_name || ""} submitted a proposal for your land in ${sanitizedPayload.land_city || ""}`,
        entityType: "deal_request",
      },
      proposal_viewed: {
        titleAr: "تمت المعاينة — جاري الرد من المالك",
        titleEn: "Proposal Viewed — Owner Reviewing",
        msgAr: `اطّلع مالك الأرض في ${sanitizedPayload.land_city || ""} على عرضك. سيتم إعلامك بالقرار قريباً.`,
        msgEn: `The landowner in ${sanitizedPayload.land_city || ""} reviewed your proposal. You'll be notified of the decision soon.`,
        entityType: "deal_request",
      },
      developer_selected: {
        titleAr: "🎉 تم اختياركم!",
        titleEn: "🎉 You've Been Selected!",
        msgAr: `تم اختياركم كمطور للفرصة في ${sanitizedPayload.land_city || ""}. المرحلة التالية: التفاوض.`,
        msgEn: `You've been selected as the developer for the opportunity in ${sanitizedPayload.land_city || ""}. Next: Negotiation.`,
        entityType: "deal",
      },
      developer_not_selected: {
        titleAr: "لم يتم اختياركم",
        titleEn: "Not Selected",
        msgAr: `لم يتم اختياركم للفرصة في ${sanitizedPayload.land_city || ""}. نتطلع للتعاون في فرص أخرى.`,
        msgEn: `You were not selected for the opportunity in ${sanitizedPayload.land_city || ""}. We look forward to future opportunities.`,
        entityType: "deal_request",
      },
      request_approved: {
        titleAr: "تمت الموافقة على طلبك",
        titleEn: "Request Approved",
        msgAr: `تمت الموافقة على طلب الشراكة الخاص بك للأرض في ${sanitizedPayload.land_city || ""}`,
        msgEn: `Your partnership request for land in ${sanitizedPayload.land_city || ""} has been approved`,
        entityType: "deal_request",
      },
      request_rejected: {
        titleAr: "تم رفض طلبك",
        titleEn: "Request Rejected",
        msgAr: `تم رفض طلب الشراكة الخاص بك للأرض في ${sanitizedPayload.land_city || ""}${sanitizedPayload.reject_reason ? `. السبب: ${sanitizedPayload.reject_reason}` : ""}`,
        msgEn: `Your partnership request for land in ${sanitizedPayload.land_city || ""} was rejected${sanitizedPayload.reject_reason ? `. Reason: ${sanitizedPayload.reject_reason}` : ""}`,
        entityType: "deal_request",
      },
      meeting_scheduled: {
        titleAr: "اجتماع مجدول",
        titleEn: "Meeting Scheduled",
        msgAr: `تم جدولة اجتماع بخصوص الفرصة في ${sanitizedPayload.land_city || ""} - ${sanitizedPayload.meeting_date || ""} ${sanitizedPayload.meeting_time || ""}`,
        msgEn: `Meeting scheduled for opportunity in ${sanitizedPayload.land_city || ""} - ${sanitizedPayload.meeting_date || ""} ${sanitizedPayload.meeting_time || ""}`,
        entityType: "deal",
      },
    };

    const notif = notifMap[sanitizedPayload.type];
    if (notif) {
      // Determine who gets in-app notifications
      if (sanitizedPayload.type === "draft_created_for_owner" && sanitizedPayload.owner_user_id) {
        await createInAppNotification(supabaseAdmin, sanitizedPayload.owner_user_id, sanitizedPayload.type, notif.titleAr, notif.titleEn, notif.msgAr, notif.msgEn, notif.entityType);
      } else if (sanitizedPayload.type === "request_submitted" && sanitizedPayload.owner_user_id) {
        for (const adminId of adminUserIds) {
          await createInAppNotification(supabaseAdmin, adminId, sanitizedPayload.type, notif.titleAr, notif.titleEn, notif.msgAr, notif.msgEn, notif.entityType, sanitizedPayload.request_id);
        }
        if (!adminUserIds.includes(sanitizedPayload.owner_user_id)) {
          await createInAppNotification(supabaseAdmin, sanitizedPayload.owner_user_id, sanitizedPayload.type,
            "طلب شراكة جديد على أرضك", "New Partnership Request on Your Land",
            `تقدم مطور ${sanitizedPayload.developer_name || ""} بطلب شراكة على أرضك في ${sanitizedPayload.land_city || ""}`,
            `Developer ${sanitizedPayload.developer_name || ""} submitted a partnership request for your land in ${sanitizedPayload.land_city || ""}`,
            notif.entityType, sanitizedPayload.request_id
          );
        }
      } else if (["proposal_received"].includes(sanitizedPayload.type) && sanitizedPayload.owner_user_id) {
        // Notify owner
        await createInAppNotification(supabaseAdmin, sanitizedPayload.owner_user_id, sanitizedPayload.type, notif.titleAr, notif.titleEn, notif.msgAr, notif.msgEn, notif.entityType, sanitizedPayload.request_id);
        // Also notify admins
        for (const adminId of adminUserIds) {
          if (adminId !== sanitizedPayload.owner_user_id) {
            await createInAppNotification(supabaseAdmin, adminId, sanitizedPayload.type, notif.titleAr, notif.titleEn, notif.msgAr, notif.msgEn, notif.entityType, sanitizedPayload.request_id);
          }
        }
      } else if (["proposal_viewed", "developer_selected", "developer_not_selected", "request_approved", "request_rejected"].includes(sanitizedPayload.type) && sanitizedPayload.developer_user_id) {
        // Notify developer
        await createInAppNotification(supabaseAdmin, sanitizedPayload.developer_user_id, sanitizedPayload.type, notif.titleAr, notif.titleEn, notif.msgAr, notif.msgEn, notif.entityType, sanitizedPayload.request_id || sanitizedPayload.deal_id);
        // Also notify admins
        for (const adminId of adminUserIds) {
          if (adminId !== sanitizedPayload.developer_user_id) {
            await createInAppNotification(supabaseAdmin, adminId, sanitizedPayload.type, notif.titleAr, notif.titleEn, notif.msgAr, notif.msgEn, notif.entityType, sanitizedPayload.request_id || sanitizedPayload.deal_id);
          }
        }
      } else if (sanitizedPayload.type === "meeting_scheduled") {
        // Notify all: admin, owner, developer
        for (const adminId of adminUserIds) {
          await createInAppNotification(supabaseAdmin, adminId, sanitizedPayload.type, notif.titleAr, notif.titleEn, notif.msgAr, notif.msgEn, notif.entityType, sanitizedPayload.deal_id);
        }
        if (sanitizedPayload.owner_user_id && !adminUserIds.includes(sanitizedPayload.owner_user_id)) {
          await createInAppNotification(supabaseAdmin, sanitizedPayload.owner_user_id, sanitizedPayload.type, notif.titleAr, notif.titleEn, notif.msgAr, notif.msgEn, notif.entityType, sanitizedPayload.deal_id);
        }
        if (sanitizedPayload.developer_user_id && !adminUserIds.includes(sanitizedPayload.developer_user_id)) {
          await createInAppNotification(supabaseAdmin, sanitizedPayload.developer_user_id, sanitizedPayload.type, notif.titleAr, notif.titleEn, notif.msgAr, notif.msgEn, notif.entityType, sanitizedPayload.deal_id);
        }
      } else {
        // Default: notify admins
        for (const adminId of adminUserIds) {
          await createInAppNotification(supabaseAdmin, adminId, sanitizedPayload.type, notif.titleAr, notif.titleEn, notif.msgAr, notif.msgEn, notif.entityType, sanitizedPayload.deal_id || sanitizedPayload.request_id);
        }
      }
    }

    // Send email
    const { subject, html, to } = buildEmailHtml(sanitizedPayload);

    if (!to) {
      console.warn("No recipient email for notification type:", sanitizedPayload.type);
      return new Response(JSON.stringify({ success: true, warning: "No recipient email" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const rawKey = Deno.env.get("RESEND_API_KEY") || "";
    const resendApiKey = rawKey.replace(/[^\x20-\x7E]/g, "").trim();

    if (resendApiKey) {
      // Send to primary recipient
      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: new Headers([
          ["Authorization", "Bearer " + resendApiKey],
          ["Content-Type", "application/json"],
        ]),
        body: JSON.stringify({
          from: "SYNA Platform <onboarding@resend.dev>",
          to: [to],
          subject,
          html,
        }),
      });
      const emailData = await emailRes.json();
      if (!emailRes.ok) {
        console.error("Email error:", emailData);
      } else {
        console.log("Notification email sent:", sanitizedPayload.type, "to:", to);
      }

      // For meeting_scheduled, also email the developer and owner
      if (sanitizedPayload.type === "meeting_scheduled") {
        const additionalRecipients = [sanitizedPayload.developer_email, sanitizedPayload.owner_email].filter(e => e && e !== to);
        for (const recipient of additionalRecipients) {
          try {
            await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: new Headers([
                ["Authorization", "Bearer " + resendApiKey],
                ["Content-Type", "application/json"],
              ]),
              body: JSON.stringify({
                from: "SYNA Platform <onboarding@resend.dev>",
                to: [recipient],
                subject,
                html,
              }),
            });
          } catch (e) {
            console.error("Additional email error:", e);
          }
        }
      }
    } else {
      console.warn("No RESEND_API_KEY configured");
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
