import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import PageHeader from "@/components/landing/PageHeader";
import { Clock, MapPin, Building2, Send, CheckCircle2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import headerContactImg from "@/assets/header-contact.jpg";

const Contact: React.FC = () => {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  usePageTitle(isAr ? "سينا | تواصل تنفيذي" : "SYNA | Executive Inquiry");
  const { toast } = useToast();

  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast({ variant: "destructive", title: isAr ? "يرجى تعبئة الحقول المطلوبة" : "Please fill required fields" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke("send-contact", { body: form });
      if (error) throw error;
      setSubmitted(true);
      toast({ title: isAr ? "تم إرسال طلبك بنجاح" : "Your inquiry has been submitted" });
    } catch (err: any) {
      toast({ variant: "destructive", title: isAr ? "حدث خطأ" : "Error", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = "h-14 w-full bg-transparent border-b border-primary/20 text-primary focus:border-accent focus:outline-none transition-all placeholder:text-muted-foreground/30 text-sm";

  return (
    <div className="min-h-screen bg-background flex flex-col pt-0">
      <Navbar />
      <PageHeader 
        icon={Send} 
        title={isAr ? "تواصل تنفيذي" : "Executive Inquiry"} 
        description={isAr ? "للاستفسارات الرسمية بشأن الشراكات الاستثمارية الاستراتيجية أو تطوير الأصول المقننة في العاصمة." : "For official inquiries regarding strategic investment partnerships or structured asset development in the capital."} 
        backgroundImage={headerContactImg} 
      />

      <main className="container flex-1 py-16 md:py-32">
        <div className="grid gap-24 lg:grid-cols-12 max-w-7xl mx-auto">
          {/* Inquiry Form */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-7">
            <div className="mb-16 border-s-2 border-accent ps-8">
              <h2 className="text-3xl font-medium tracking-tight text-primary uppercase">{isAr ? "النفاذ للمراسلات" : "Executive Correspondence"}</h2>
              <p className="text-sm font-light text-muted-foreground mt-4">{isAr ? "سيقوم فريق الحوكمة المؤسسية بمراجعة طلبكم والرد بجدولة رسمية خلال ٢٤ ساعة." : "Our institutional governance team will review and respond with a formal schedule within 24 hours."}</p>
            </div>

            {submitted ? (
              <div className="flex flex-col items-start justify-center py-20 ps-12 border-s-2 border-accent bg-muted/5">
                <CheckCircle2 className="h-10 w-10 text-accent mb-8" strokeWidth={1} />
                <h3 className="text-2xl font-medium text-primary uppercase tracking-wider mb-4">{isAr ? "ارسال ناجح" : "Submission Successful"}</h3>
                <p className="text-base font-light text-muted-foreground mb-12">{isAr ? "نشكركم على نفاذكم لسينا، تم توجيه الطلب للجهة المختصة." : "Thank you for engaging SYNA, your request has been routed to the relevant department."}</p>
                <button onClick={() => { setSubmitted(false); setForm({ name: "", email: "", subject: "", message: "" }); }} className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent border-b border-accent pb-1">
                  {isAr ? "بِدء مراسلة جديدة" : "New Correspondence"}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-12">
                <div className="grid gap-12 sm:grid-cols-2">
                  <div className="space-y-4">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/40">{isAr ? "الاسم" : "Entity Representative"}</label>
                    <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className={inputClasses} />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/40">{isAr ? "البريد المؤسسي" : "Corporate Email"}</label>
                    <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} dir="ltr" required className={inputClasses} />
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/40">{isAr ? "الغرض من التواصل" : "Nature of Inquiry"}</label>
                  <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className={inputClasses} />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/40">{isAr ? "التفاصيل التنفيذية" : "Executive Details"}</label>
                  <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={6} required className="w-full bg-transparent border-b border-primary/20 text-primary py-4 focus:border-accent focus:outline-none transition-all placeholder:text-muted-foreground/30 text-sm resize-none" />
                </div>
                <button type="submit" className="luxury-button h-16 w-full border-primary/20 hover:border-accent hover:bg-accent hover:text-primary" disabled={loading}>
                  {loading ? (isAr ? "جاري المعالجة..." : "Processing...") : (isAr ? "إرسال البيانات" : "Dispatch Inquiry")}
                </button>
              </form>
            )}
          </motion.div>

          {/* Institutional Info Column */}
          <div className="lg:col-span-5">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bg-primary p-16 text-white relative">
              <div className="luxury-grid absolute inset-0 opacity-10 pointer-events-none" />
              <div className="relative z-10">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-accent mb-16">{isAr ? "المعلومات المؤسسية" : "Institutional Intelligence"}</h3>
                
                <div className="space-y-16">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/30">{isAr ? "المقر الرياض" : "Riyadh HQ"}</h4>
                    <p className="text-sm font-light leading-relaxed">{isAr ? "مركز الأعمال، المملكة العربية السعودية" : "Executive Business District, Riyadh, KSA"}</p>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/30">{isAr ? "الفترة التشغيلية" : "Operational Hours"}</h4>
                    <p className="text-sm font-light leading-relaxed">{isAr ? "الأحد — الخميس | ٩ ص — ٤ م" : "Sunday — Thursday | 09:00 — 16:00"}</p>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/30">{isAr ? "بوابات النفاذ" : "Access Portals"}</h4>
                    <Link to="/auth" className="text-xs font-bold border-b border-accent pb-1 text-accent hover:text-white hover:border-white transition-all">
                        {isAr ? "بوابة الشركاء المعتمدين" : "Certified Partners Portal"}
                    </Link>
                  </div>
                </div>

                <div className="mt-28 grayscale opacity-20 hover:opacity-100 transition-opacity duration-1000">
                  <iframe src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d432.7034625093088!2d46.63614764513629!3d24.83374433078794!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e1!3m2!1sar!2ssa!4v1771817187352!5m2!1sar!2ssa" width="100%" height="200" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="SYNA Location" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;
