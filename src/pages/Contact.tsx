import React, { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useMetaTags } from "@/hooks/useMetaTags";
import PageShell from "@/components/landing/PageShell";
import InnerHero from "@/components/landing/InnerHero";
import heroImg from "@/assets/hero/contact.svg";
import { Loader2, CheckCircle2, MessageCircle, Clock, ShieldCheck, Headphones, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Contact: React.FC = () => {
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";
  usePageTitle(isAr ? "تواصل معنا" : "Contact Us");

  useMetaTags({
    title: isAr
      ? "سينا | تواصل معنا — دعم شراكات التطوير العقاري"
      : "Contact SINA | Real-Estate Partnership Support Team",
    description: isAr
      ? "تواصل مع فريق سينا للاستفسارات والدعم حول شراكات التطوير العقاري، تسجيل الأراضي، تأهيل المطورين، أو أي خدمة من خدمات المنصة في المملكة."
      : "Reach the SINA team for inquiries, developer onboarding, landowner support, and partnership guidance across our Saudi real-estate development platform.",
    canonical: isAr ? "https://cidoma.com/contact" : "https://cidoma.com/en/contact",
    ogTitle: isAr ? "سينا | تواصل معنا" : "Contact SINA",
    ogDescription: isAr
      ? "فريق دعم متخصص في شراكات التطوير العقاري جاهز لخدمتك."
      : "A specialized support team ready to help with your real-estate partnership questions.",
    ogImage: "https://cidoma.com/og-image.png",
    ogType: "website",
    twitterCard: "summary_large_image",
    hreflangAlternate: { lang: isAr ? "en" : "ar", url: isAr ? "https://cidoma.com/en/contact" : "https://cidoma.com/contact" },
    structuredData: [
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: isAr ? "الرئيسية" : "Home", item: isAr ? "https://cidoma.com/" : "https://cidoma.com/en" },
          { "@type": "ListItem", position: 2, name: isAr ? "تواصل معنا" : "Contact", item: isAr ? "https://cidoma.com/contact" : "https://cidoma.com/en/contact" },
        ],
      },
    ],
  });

  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { error: fnError } = await supabase.functions.invoke("send-contact", { body: form });
      if (fnError) throw fnError;
      setSent(true);
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch {
      setError(t.contactPage.error);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full h-12 px-5 bg-white border border-slate-200 rounded-xl text-[14px] text-[#020202] placeholder:text-slate-400 focus:outline-none focus:border-[#2B2B2B] focus:ring-2 focus:ring-[#2B2B2B]/10 transition-all duration-200";

  const whyContact = isAr
    ? [
        { icon: Headphones, title: "دعم متخصص", desc: "فريقنا يضم خبراء في الشراكات التطويرية العقارية جاهزون لمساعدتك في كل استفساراتك" },
        { icon: Clock, title: "استجابة سريعة", desc: "نلتزم بالرد على جميع الاستفسارات خلال أقصر وقت ممكن لضمان راحتك" },
        { icon: ShieldCheck, title: "سرية تامة", desc: "جميع محادثاتك واستفساراتك تُعامل بسرية تامة وخصوصية كاملة" },
      ]
    : [
        { icon: Headphones, title: "Specialized Support", desc: "Our team includes experts in real estate development partnerships ready to help with all your inquiries" },
        { icon: Clock, title: "Fast Response", desc: "We are committed to responding to all inquiries as quickly as possible to ensure your comfort" },
        { icon: ShieldCheck, title: "Complete Confidentiality", desc: "All your conversations and inquiries are treated with complete confidentiality and privacy" },
      ];

  return (
    <PageShell>
      <InnerHero
        pageSlug="contact"
        title={isAr ? "تواصل معنا" : "Contact Us"}
        subtitle={isAr
          ? "فريقنا جاهز لمساعدتك سواء كنت مالك أرض تبحث عن شريك تطوير أو مطوراً عقارياً يبحث عن فرص حقيقية"
          : "Our team is ready to help whether youre a landowner seeking a development partner or a developer looking for real opportunities"}
        isAr={isAr}
        image={heroImg}
        illustrated
      />

      {/* Why Contact Us */}
      <section className="relative py-16 lg:py-20 bg-gradient-to-b from-white to-[#FAFBFC] overflow-hidden" dir={isAr ? "rtl" : "ltr"}>
        <div className="absolute -top-20 end-[-100px] w-[380px] h-[380px] rounded-full bg-[#C45A41]/[0.06] blur-3xl pointer-events-none" />
        <div className="container relative">
          <div className="grid sm:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {whyContact.map((item, i) => (
              <div key={i} className="group relative bg-white rounded-2xl p-7 ring-1 ring-slate-200/70 hover:ring-[#C45A41]/30 shadow-[0_10px_30px_-15px_rgba(15,31,46,0.12)] hover:shadow-[0_20px_50px_-20px_rgba(194,168,107,0.25)] transition-all duration-500 hover:-translate-y-1">
                <item.icon className="w-6 h-6 text-[#A24832] mb-4" strokeWidth={1.7} />
                <h3 className="text-[15px] font-bold text-[#020202] mb-2 tracking-tight">{item.title}</h3>
                <p className="text-[13px] text-slate-500 leading-[1.9]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form + WhatsApp CTA */}
      <section className="relative py-20 lg:py-24 bg-gradient-to-b from-[#FAFBFC] to-white overflow-hidden" dir={isAr ? "rtl" : "ltr"}>
        <div className="absolute top-1/3 start-[-140px] w-[420px] h-[420px] rounded-full bg-[#2B2B2B]/[0.06] blur-3xl pointer-events-none" />
        <div className="container relative">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#020202] mb-4 tracking-tight leading-[1.1]">
                {isAr ? "أرسل لنا رسالتك" : "Send Us a Message"}
              </h2>
              <p className="text-[15px] text-slate-600 leading-relaxed max-w-xl mx-auto">
                {isAr
                  ? "سواء كان لديك استفسار عن سينا أو تحتاج مساعدة في التسجيل أو ترغب في معرفة المزيد عن شراكات التطوير نحن هنا لمساعدتك"
                  : "Whether you have a question about the platform, need help registering, or want to learn more about development partnerships we are here to help"}
              </p>
            </div>

            {/* WhatsApp CTA */}
            <div className="bg-white rounded-2xl ring-1 ring-slate-200/70 shadow-[0_10px_30px_-15px_rgba(15,31,46,0.12)] p-6 mb-8">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex-1 text-center sm:text-start">
                  <h3 className="text-[16px] font-bold text-[#020202] mb-1 tracking-tight">
                    {isAr ? "تفضّل التواصل السريع؟" : "Prefer quick communication?"}
                  </h3>
                  <p className="text-[13px] text-slate-500 leading-relaxed">
                    {isAr ? "تواصل معنا مباشرة عبر الواتساب وسيرد عليك فريقنا في أسرع وقت" : "Contact us directly via WhatsApp and our team will respond as soon as possible"}
                  </p>
                </div>
                <a
                  href="https://wa.me/966504566777"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 h-12 px-7 bg-gradient-to-br from-[#25D366] to-[#1fba59] hover:from-[#1fba59] hover:to-[#17964a] text-white text-[14px] font-bold rounded-xl shadow-lg shadow-[#25D366]/25 transition-all duration-300 shrink-0"
                >
                  <MessageCircle className="w-[18px] h-[18px]" strokeWidth={1.75} />
                  {isAr ? "تواصل عبر الواتساب" : "Chat on WhatsApp"}
                </a>
              </div>
            </div>

            {sent ? (
              <div className="text-center py-20 bg-white rounded-2xl ring-1 ring-slate-200/70 shadow-[0_20px_60px_-30px_rgba(15,31,46,0.18)]">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mb-5 mx-auto" strokeWidth={1.7} />
                <p className="text-[18px] font-bold text-[#020202] tracking-tight">{t.contactPage.success}</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl ring-1 ring-slate-200/70 shadow-[0_20px_60px_-30px_rgba(15,31,46,0.18)] p-8 md:p-10">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[13px] font-semibold text-[#020202] mb-2">{t.contactPage.name}</label>
                      <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-[13px] font-semibold text-[#020202] mb-2">{t.contactPage.email}</label>
                      <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-[#020202] mb-2">{t.contactPage.subject}</label>
                    <input type="text" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-[#020202] mb-2">{t.contactPage.message}</label>
                    <textarea required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className={`${inputClass} h-auto py-4 resize-none`} />
                  </div>
                  {error && <p className="text-[13px] text-red-600 bg-red-50 border border-red-100 px-4 py-3 rounded-lg">{error}</p>}
                  <button type="submit" disabled={loading} className="w-full h-13 py-3.5 bg-gradient-to-br from-[#2B2B2B] to-[#020202] hover:from-[#020202] hover:to-[#020202] text-white text-[15px] font-bold rounded-xl shadow-lg shadow-[#2B2B2B]/25 transition-all duration-300 disabled:opacity-60 flex items-center justify-center gap-2 tracking-tight">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" strokeWidth={2} />}
                    {loading ? t.contactPage.sending : t.contactPage.send}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </section>
    </PageShell>
  );
};

export default Contact;
