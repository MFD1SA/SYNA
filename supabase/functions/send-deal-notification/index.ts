import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type NotificationType =
  | "request_submitted"    // Developer submits → notify owner
  | "request_approved"     // Owner approves → notify developer
  | "request_rejected"     // Owner rejects → notify developer
  | "meeting_scheduled";   // Owner schedules meeting → notify admin

interface NotificationPayload {
  type: NotificationType;
  request_id?: string;
  deal_id?: string;
  meeting_date?: string;
  meeting_time?: string;
  reject_reason?: string;
  developer_name?: string;
  developer_email?: string;
  owner_name?: string;
  owner_email?: string;
  land_city?: string;
  land_district?: string;
}

const ADMIN_EMAIL = "mfdalsulis@gmail.com";

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
      .footer { background: #f8fafc; padding: 16px 30px; text-align: center; border-top: 1px solid #e2e8f0; }
      .footer p { color: #94a3b8; font-size: 11px; margin: 0; }
    </style>
  `;

  switch (type) {
    case "request_submitted":
      return {
        to: payload.owner_email || ADMIN_EMAIL,
        subject: `DOMA | طلب شراكة جديد - ${location}`,
        html: `<!DOCTYPE html><html><head>${baseStyle}</head><body>
          <div class="container">
            <div class="header">
              <h1>🔔 طلب شراكة جديد</h1>
              <p>تم تقديم طلب شراكة على أرضك</p>
            </div>
            <div class="body">
              <p style="color:#475569;font-size:14px;">مرحباً ${payload.owner_name || "مالك الأرض"}،</p>
              <p style="color:#475569;font-size:14px;">تم تقديم طلب شراكة جديد على أرضك من مطور عقاري. يرجى مراجعة التفاصيل واتخاذ القرار المناسب.</p>
              <div class="info-box">
                <div class="info-row"><span class="info-label">المطور:</span><span class="info-value">${payload.developer_name || "—"}</span></div>
                <div class="info-row"><span class="info-label">الموقع:</span><span class="info-value">${location}</span></div>
              </div>
              <p style="color:#64748b;font-size:13px;">يمكنك الدخول إلى لوحة التحكم لمراجعة الطلب والموافقة أو الرفض.</p>
            </div>
            <div class="footer"><p>DOMA Platform — منصة دوما للشراكات العقارية</p></div>
          </div>
        </body></html>`,
      };

    case "request_approved":
      return {
        to: payload.developer_email || "",
        subject: `DOMA | تمت الموافقة على طلبك - ${location}`,
        html: `<!DOCTYPE html><html><head>${baseStyle}</head><body>
          <div class="container">
            <div class="header">
              <h1>✅ تمت الموافقة على طلبك</h1>
              <p>أخبار رائعة! تمت الموافقة على طلب الشراكة</p>
            </div>
            <div class="body">
              <p style="color:#475569;font-size:14px;">مرحباً ${payload.developer_name || "المطور"}،</p>
              <p style="color:#475569;font-size:14px;">يسعدنا إبلاغك بأن مالك الأرض قد وافق على طلب الشراكة الخاص بك.</p>
              <div class="info-box">
                <div class="info-row"><span class="info-label">الموقع:</span><span class="info-value">${location}</span></div>
                <div class="info-row"><span class="info-label">الحالة:</span><span class="info-value"><span class="badge badge-success">تمت الموافقة</span></span></div>
              </div>
              <p style="color:#64748b;font-size:13px;">سيتم التواصل معك قريباً من مدير النظام لترتيب اجتماع مع مالك الأرض.</p>
            </div>
            <div class="footer"><p>DOMA Platform — منصة دوما للشراكات العقارية</p></div>
          </div>
        </body></html>`,
      };

    case "request_rejected":
      return {
        to: payload.developer_email || "",
        subject: `DOMA | تم رفض طلبك - ${location}`,
        html: `<!DOCTYPE html><html><head>${baseStyle}</head><body>
          <div class="container">
            <div class="header" style="background:linear-gradient(135deg,#dc2626,#991b1b);">
              <h1>❌ تم رفض الطلب</h1>
              <p>نأسف، تم رفض طلب الشراكة</p>
            </div>
            <div class="body">
              <p style="color:#475569;font-size:14px;">مرحباً ${payload.developer_name || "المطور"}،</p>
              <p style="color:#475569;font-size:14px;">نأسف لإبلاغك بأن مالك الأرض قرر رفض طلب الشراكة الخاص بك.</p>
              <div class="info-box">
                <div class="info-row"><span class="info-label">الموقع:</span><span class="info-value">${location}</span></div>
                <div class="info-row"><span class="info-label">الحالة:</span><span class="info-value"><span class="badge badge-danger">مرفوض</span></span></div>
                ${payload.reject_reason ? `<div class="info-row"><span class="info-label">السبب:</span><span class="info-value">${payload.reject_reason}</span></div>` : ""}
              </div>
              <p style="color:#64748b;font-size:13px;">يمكنك التقديم على فرص أخرى متاحة في المنصة.</p>
            </div>
            <div class="footer"><p>DOMA Platform — منصة دوما للشراكات العقارية</p></div>
          </div>
        </body></html>`,
      };

    case "meeting_scheduled":
      return {
        to: ADMIN_EMAIL,
        subject: `DOMA | اجتماع جديد مطلوب ترتيبه - ${location}`,
        html: `<!DOCTYPE html><html><head>${baseStyle}</head><body>
          <div class="container">
            <div class="header" style="background:linear-gradient(135deg,#2563eb,#1e40af);">
              <h1>📅 اجتماع جديد مطلوب ترتيبه</h1>
              <p>مالك الأرض حدد موعد الاجتماع — يرجى التنسيق مع المطور</p>
            </div>
            <div class="body">
              <p style="color:#475569;font-size:14px;">مرحباً مدير النظام،</p>
              <p style="color:#475569;font-size:14px;">قام مالك الأرض بتحديد موعد اجتماع. يرجى التواصل مع المطور وإخباره بالتفاصيل.</p>
              <div class="info-box">
                <div class="info-row"><span class="info-label">الموقع:</span><span class="info-value">${location}</span></div>
                <div class="info-row"><span class="info-label">المالك:</span><span class="info-value">${payload.owner_name || "—"}</span></div>
                <div class="info-row"><span class="info-label">المطور:</span><span class="info-value">${payload.developer_name || "—"}</span></div>
                <div class="info-row"><span class="info-label">البريد:</span><span class="info-value">${payload.developer_email || "—"}</span></div>
                <div class="info-row"><span class="info-label">التاريخ:</span><span class="info-value">${payload.meeting_date || "—"}</span></div>
                <div class="info-row"><span class="info-label">الوقت:</span><span class="info-value">${payload.meeting_time || "—"}</span></div>
              </div>
              <p style="color:#64748b;font-size:13px;">يرجى التواصل مع المطور لتأكيد الموعد وإرسال رابط الاجتماع.</p>
            </div>
            <div class="footer"><p>DOMA Platform — منصة دوما للشراكات العقارية</p></div>
          </div>
        </body></html>`,
      };

    default:
      return { to: ADMIN_EMAIL, subject: "DOMA Notification", html: "<p>Notification</p>" };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: NotificationPayload = await req.json();

    if (!payload.type) {
      return new Response(JSON.stringify({ error: "Missing notification type" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { subject, html, to } = buildEmailHtml(payload);

    if (!to) {
      console.warn("No recipient email for notification type:", payload.type);
      return new Response(JSON.stringify({ success: true, warning: "No recipient email" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Send email via Resend
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
          from: "DOMA Platform <onboarding@resend.dev>",
          to: [to],
          subject,
          html,
        }),
      });
      const emailData = await emailRes.json();
      if (!emailRes.ok) {
        console.error("Email error:", emailData);
        return new Response(JSON.stringify({ error: "Email send failed", details: emailData }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      console.log("Notification email sent:", payload.type, "to:", to);
    } else {
      console.warn("No RESEND_API_KEY configured");
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
