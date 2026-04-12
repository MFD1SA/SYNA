import React, { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import PageShell from "@/components/landing/PageShell";
import InnerHero from "@/components/landing/InnerHero";
import { Loader2, CheckCircle2 } from "lucide-react";
import headerContactImg from "@/assets/header-contact.jpg";
import { supabase } from "@/integrations/supabase/client";

const Contact: React.FC = () => {
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";
  usePageTitle(isAr ? "تواصل معنا" : "Contact Us");

  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { error: fnError } = await supabase.functions.invoke("send-contact", {
        body: form,
      });
      if (fnError) throw fnError;
      setSent(true);
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch {
      setError(t.contactPage.error);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full h-11 px-4 bg-[#F7F9FB] border border-gray-200 rounded-lg text-[14px] text-sina-charcoal placeholder:text-gray-400 focus:outline-none focus:border-sina-blue focus:ring-1 focus:ring-sina-blue/20 transition-colors";

  return (
    <PageShell>
      <InnerHero title={t.contactPage.title} subtitle={t.contactPage.subtitle} isAr={isAr} image={headerContactImg} />

      <section className="py-20 lg:py-28 bg-white" dir={isAr ? "rtl" : "ltr"}>
        <div className="container max-w-xl">
          {sent ? (
            <div className="text-center py-16">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
              <p className="text-[16px] font-semibold text-sina-charcoal">{t.contactPage.success}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-[13px] font-medium text-gray-600 mb-2">{t.contactPage.name}</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-gray-600 mb-2">{t.contactPage.email}</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-gray-600 mb-2">{t.contactPage.subject}</label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-gray-600 mb-2">{t.contactPage.message}</label>
                <textarea
                  required
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className={`${inputClass} h-auto py-3 resize-none`}
                />
              </div>
              {error && <p className="text-[13px] text-red-500">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-sina-blue text-white text-[14px] font-semibold rounded-lg hover:bg-sina-dark-blue transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? t.contactPage.sending : t.contactPage.send}
              </button>
            </form>
          )}
        </div>
      </section>
    </PageShell>
  );
};

export default Contact;
