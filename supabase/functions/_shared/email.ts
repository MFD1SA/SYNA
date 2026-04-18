// Unified Resend email sender + luxury RTL template.
// Production-ready — used by send-contact, notify-new-opportunity,
// notify-interest and any future notification function.

export const FROM_EMAIL = "SINA <no-reply@mail.cidoma.com>";
export const LOGO_URL = "https://cidoma.com/assets/logo-Cb0_L6Uy.png";
export const SITE_URL = Deno.env.get("PUBLIC_SITE_URL") ?? "https://cidoma.com";
export const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") ?? "mfdalsulis@gmail.com";

const RESEND_API_KEY = (Deno.env.get("RESEND_API_KEY") || "")
  .replace(/[^\x20-\x7E]/g, "")
  .trim();

export interface SendEmailInput {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
  from?: string;
}

export interface SendEmailResult {
  ok: boolean;
  id?: string;
  error?: string;
  status?: number;
}

/** Send one email via Resend. Returns structured result — never throws. */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  if (!RESEND_API_KEY) {
    console.error("[email] RESEND_API_KEY not configured");
    return { ok: false, error: "RESEND_API_KEY not configured" };
  }

  const payload: Record<string, unknown> = {
    from: input.from ?? FROM_EMAIL,
    to: Array.isArray(input.to) ? input.to : [input.to],
    subject: input.subject,
    html: input.html,
  };
  if (input.replyTo) payload.reply_to = input.replyTo;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("[email] Resend error", res.status, data);
      return { ok: false, status: res.status, error: JSON.stringify(data) };
    }
    return { ok: true, id: (data as { id?: string }).id, status: res.status };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[email] network error", message);
    return { ok: false, error: message };
  }
}

/** HTML-escape helper for safe interpolation of user-supplied strings. */
export function esc(str: string | null | undefined): string {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface DataRow {
  label: string;
  value: string;
  /** When true the value is rendered as a multiline block (pre-wrap). */
  block?: boolean;
}

export interface LuxuryTemplateInput {
  /** Short eyebrow above the headline, e.g. "اتصل بنا". */
  eyebrow: string;
  /** Main headline inside the white card. */
  headline: string;
  /** Short lede paragraph under the headline. */
  intro?: string;
  /** Ordered data rows — label/value table. */
  rows?: DataRow[];
  /** Optional call-to-action button. */
  cta?: { label: string; url: string };
  /** Optional closing paragraph below the CTA. */
  outro?: string;
}

/**
 * Enterprise-grade RTL email template.
 * - 100% inline styles (Gmail/Outlook safe)
 * - Light neutral backdrop + white card with subtle shadow
 * - Navy / gold SINA palette
 * - Brand logo from cidoma.com (hosted png, no inlining)
 */
export function renderLuxuryEmail(input: LuxuryTemplateInput): string {
  const { eyebrow, headline, intro, rows, cta, outro } = input;

  const rowsHtml = (rows ?? [])
    .map((r) => {
      const valueStyle = r.block
        ? "padding:14px 18px;color:#0F1F2E;font-size:15px;line-height:1.9;white-space:pre-wrap;word-break:break-word;"
        : "padding:14px 18px;color:#0F1F2E;font-size:15px;line-height:1.7;font-weight:600;";
      return `
        <tr>
          <td style="padding:14px 18px;background:#FAFAFA;color:#6B7280;font-size:12px;font-weight:600;letter-spacing:0.02em;width:140px;border-bottom:1px solid #F1F1F1;vertical-align:top;">${esc(r.label)}</td>
          <td style="${valueStyle}border-bottom:1px solid #F1F1F1;vertical-align:top;">${r.block ? esc(r.value) : esc(r.value)}</td>
        </tr>`;
    })
    .join("");

  const ctaHtml = cta
    ? `
    <tr>
      <td align="center" style="padding:32px 0 8px;">
        <a href="${esc(cta.url)}"
           style="display:inline-block;background:linear-gradient(135deg,#2B4C66 0%,#1E374B 100%);color:#FFFFFF;text-decoration:none;padding:14px 38px;border-radius:12px;font-size:14px;font-weight:700;letter-spacing:0.02em;box-shadow:0 10px 24px -10px rgba(43,76,102,0.55);">
          ${esc(cta.label)}
        </a>
      </td>
    </tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="x-apple-disable-message-reformatting" />
<title>${esc(headline)}</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Cairo','Segoe UI',Tahoma,Arial,sans-serif;direction:rtl;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px;">
  <tr>
    <td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#FFFFFF;border-radius:18px;overflow:hidden;box-shadow:0 18px 48px -24px rgba(15,31,46,0.18);border:1px solid #EFEFEF;">
        <!-- Brand header -->
        <tr>
          <td align="center" style="padding:36px 32px 18px;background:#FFFFFF;">
            <img src="${LOGO_URL}" alt="SINA" width="120" style="display:block;height:auto;max-width:120px;" />
          </td>
        </tr>
        <!-- Gold hairline -->
        <tr>
          <td style="padding:0 32px;">
            <div style="height:1px;background:linear-gradient(90deg,transparent 0%,#C2A86B 50%,transparent 100%);"></div>
          </td>
        </tr>
        <!-- Headline -->
        <tr>
          <td style="padding:28px 40px 8px;text-align:right;">
            <div style="color:#A88A4A;font-size:11px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;margin-bottom:10px;">${esc(eyebrow)}</div>
            <h1 style="margin:0;color:#0F1F2E;font-size:22px;font-weight:800;line-height:1.4;letter-spacing:-0.01em;">${esc(headline)}</h1>
          </td>
        </tr>
        ${
          intro
            ? `<tr><td style="padding:14px 40px 4px;text-align:right;"><p style="margin:0;color:#4B5563;font-size:14px;line-height:1.9;">${esc(intro)}</p></td></tr>`
            : ""
        }
        ${
          rows && rows.length
            ? `<tr><td style="padding:20px 40px 4px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #F1F1F1;border-radius:12px;overflow:hidden;">
                  ${rowsHtml}
                </table>
              </td></tr>`
            : ""
        }
        ${ctaHtml}
        ${
          outro
            ? `<tr><td style="padding:18px 40px 8px;text-align:right;"><p style="margin:0;color:#6B7280;font-size:13px;line-height:1.9;">${esc(outro)}</p></td></tr>`
            : ""
        }
        <!-- Footer -->
        <tr>
          <td style="padding:28px 40px 32px;">
            <div style="height:1px;background:#F1F1F1;margin-bottom:18px;"></div>
            <p style="margin:0 0 6px;color:#9CA3AF;font-size:11px;line-height:1.8;text-align:center;">سينا للاستثمارات العقارية — شراكات موثّقة وحوكمة متكاملة</p>
            <p style="margin:0;color:#9CA3AF;font-size:11px;line-height:1.8;text-align:center;">
              <a href="${SITE_URL}" style="color:#A88A4A;text-decoration:none;font-weight:600;">cidoma.com</a>
            </p>
          </td>
        </tr>
      </table>
      <p style="margin:16px auto 0;color:#9CA3AF;font-size:10.5px;line-height:1.7;max-width:560px;text-align:center;">
        هذه الرسالة أُرسلت آليًا من نظام سينا. إذا كنت لا تتوقّع استلامها يمكنك تجاهلها.
      </p>
    </td>
  </tr>
</table>
</body>
</html>`;
}

/** CORS utilities shared across public-facing functions. */
const ALLOWED_ROOT = (Deno.env.get("ALLOWED_ROOT_DOMAIN") ?? "cidoma.com").toLowerCase();

export function buildCorsHeaders(origin: string | null): HeadersInit {
  let allow = SITE_URL;
  if (origin) {
    try {
      const h = new URL(origin).hostname.toLowerCase();
      if (h === ALLOWED_ROOT || h.endsWith(`.${ALLOWED_ROOT}`) || h === "localhost") allow = origin;
    } catch {
      /* keep default */
    }
  }
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}
