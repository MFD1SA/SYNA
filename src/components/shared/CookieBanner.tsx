import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";

const STORAGE_KEY = "sina_cookie_consent_v1";

/**
 * PDPL-compliant cookie banner.
 *
 * Shows a dismissible notice on first visit. Records "accept" or
 * "reject" to localStorage so it never re-prompts the same browser.
 * We only use essential cookies (session + language preference) today,
 * so the flow is informational — analytics cookies, when added, must
 * read this flag before firing.
 */
const CookieBanner: React.FC = () => {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Defer to next tick so SSR / initial paint is never blocked
    const t = setTimeout(() => {
      try {
        if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
      } catch {
        // Private-mode / disabled storage — don't nag, just skip
      }
    }, 300);
    return () => clearTimeout(t);
  }, []);

  const decide = (value: "accepted" | "rejected") => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ value, at: Date.now() }));
    } catch { /* swallow */ }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={isAr ? "إشعار ملفات تعريف الارتباط" : "Cookie notice"}
      dir={isAr ? "rtl" : "ltr"}
      className="fixed inset-x-3 bottom-3 z-[200] md:inset-x-auto md:right-6 md:bottom-6 md:max-w-md"
    >
      <div className="rounded-2xl bg-white shadow-[0_20px_60px_-12px_rgba(15,31,46,0.35)] border border-gray-100 p-5">
        <p className="text-[13.5px] leading-[1.8] text-gray-700">
          {isAr
            ? "نستخدم ملفات تعريف ارتباط أساسية لتشغيل المنصة وتذكر تفضيلات اللغة. لا نستخدم أي ملفات إعلانية. بمواصلة الاستخدام فإنك توافق على ذلك وفق نظام حماية البيانات الشخصية في المملكة."
            : "We use essential cookies to operate the platform and remember your language preference. No advertising cookies. By continuing you agree, in line with the Saudi Personal Data Protection Law (PDPL)."}
          {" "}
          <Link to={isAr ? "/privacy" : "/en/privacy"} className="text-[#2B2B2B] font-semibold hover:underline">
            {isAr ? "سياسة الخصوصية" : "Privacy Policy"}
          </Link>
        </p>
        <div className="mt-4 flex gap-2 justify-end">
          <button
            type="button"
            onClick={() => decide("rejected")}
            className="px-4 py-2 text-[12.5px] font-semibold rounded-lg bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors"
          >
            {isAr ? "رفض" : "Reject"}
          </button>
          <button
            type="button"
            onClick={() => decide("accepted")}
            className="px-4 py-2 text-[12.5px] font-semibold rounded-lg bg-[#2B2B2B] text-white hover:bg-[#020202] transition-colors"
          >
            {isAr ? "موافق" : "Accept"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;

/** Read-only helper for analytics code: returns true iff the user
 *  has explicitly accepted cookies. Used to gate future GA/Meta pixels. */
export function hasCookieConsent(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    return JSON.parse(raw).value === "accepted";
  } catch {
    return false;
  }
}
