import React, { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import PageShell from "@/components/landing/PageShell";
import InnerHero from "@/components/landing/InnerHero";
import { Loader2, CheckCircle2, MessageCircle, Clock, ShieldCheck, Headphones } from "lucide-react";
import cityRiyadhImg from "@/assets/city-riyadh.jpg";
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

  const inputClass = "w-full h-12 px-5 bg-white border border-gray-200 rounded-xl text-[14px] text-[#1E374B] placeholder:text-gray-400 focus:outline-none focus:border-[#2B4C66] focus:ring-2 focus:ring-[#2B4C66]/10 transition-all duration-200";

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
        image={cityRiyadhImg}
      />

      {/* Why Contact Us */}
      <section className="py-12 bg-white" dir={isAr ? "rtl" : "ltr"}>
        <div className="container">
          <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {whyContact.map((item, i) => (
              <div key={i} className="text-center">
                <item.icon className="w-6 h-6 text-[#C2A86B] mx-auto mb-3" strokeWidth={1.5} />
                <h3 className="text-[14px] font-semibold text-[#1E374B] mb-2">{item.title}</h3>
                <p className="text-[13px] text-gray-500 leading-[1.8]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form + WhatsApp CTA */}
      <section className="py-14 lg:py-16 bg-[#F8FAFB]" dir={isAr ? "rtl" : "ltr"}>
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-[#1E374B] mb-3">
                {isAr ? "أرسل لنا رسالتك" : "Send Us a Message"}
              </h2>
              <p className="text-[14px] text-gray-500">
                {isAr
                  ? "سواء كان لديك استفسار عن المنصة أو تحتاج مساعدة في التسجيل أو ترغب في معرفة المزيد عن شراكات التطوير نحن هنا لمساعدتك"
                  : "Whether you have a question about the platform, need help registering, or want to learn more about development partnerships we are here to help"}
              </p>
            </div>

            {/* WhatsApp CTA */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-8">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex-1 text-center sm:text-start">
                  <h3 className="text-[16px] font-semibold text-[#1E374B] mb-1">
                    {isAr ? "تفضّل التواصل السريع؟" : "Prefer quick communication?"}
                  </h3>
                  <p className="text-[13px] text-gray-500">
                    {isAr ? "تواصل معنا مباشرة عبر الواتساب وسيرد عليك فريقنا في أسرع وقت" : "Contact us directly via WhatsApp and our team will respond as soon as possible"}
                  </p>
                </div>
                <a
                  href="https://wa.me/966504566777"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 h-12 px-8 bg-[#25D366] hover:bg-[#1fba59] text-white text-[14px] font-bold rounded-xl shadow-lg shadow-[#25D366]/20 transition-all duration-300 shrink-0"
                >
                  <MessageCircle className="w-[18px] h-[18px]" strokeWidth={1.5} />
                  {isAr ? "تواصل عبر الواتساب" : "Chat on WhatsApp"}
                </a>
              </div>
            </div>

            {sent ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-4" />
                <p className="text-[18px] font-semibold text-[#1E374B]">{t.contactPage.success}</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 md:p-10">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[13px] font-semibold text-[#1E374B] mb-2">{t.contactPage.name}</label>
                      <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-[13px] font-semibold text-[#1E374B] mb-2">{t.contactPage.email}</label>
                      <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-[#1E374B] mb-2">{t.contactPage.subject}</label>
                    <input type="text" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-[#1E374B] mb-2">{t.contactPage.message}</label>
                    <textarea required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className={`${inputClass} h-auto py-4 resize-none`} />
                  </div>
                  {error && <p className="text-[13px] text-red-500 bg-red-50 px-4 py-3 rounded-lg">{error}</p>}
                  <button type="submit" disabled={loading} className="w-full h-13 py-3.5 bg-[#2B4C66] text-white text-[15px] font-semibold rounded-xl hover:bg-[#1E374B] shadow-lg shadow-[#2B4C66]/15 transition-all duration-300 disabled:opacity-60 flex items-center justify-center gap-2">
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
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
