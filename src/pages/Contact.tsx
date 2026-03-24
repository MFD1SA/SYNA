import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import PageHeader from "@/components/landing/PageHeader";
import { Clock, MapPin, Building2, Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

  const inputClasses = "h-14 rounded-none border border-border bg-background px-6 text-primary placeholder:text-muted-foreground focus:border-accent focus:ring-1 focus:ring-accent transition-all";

  return (
    <div className="min-h-screen bg-background flex flex-col pt-12">
      <Navbar />
      <PageHeader 
        icon={Send} 
        title={isAr ? "تواصل تنفيذي" : "Executive Inquiry"} 
        description={isAr ? "للاستفسارات الرسمية بشأن الشراكات الاستثمارية أو تطوير الأصول العقارية في المملكة العربية السعودية." : "For official inquiries regarding investment partnerships or real estate asset development in KSA."} 
        backgroundImage={headerContactImg} 
      />

      <main className="container flex-1 py-16 md:py-32">
        <div className="grid gap-16 lg:grid-cols-12 max-w-7xl mx-auto">
          {/* Inquiry Form */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-7 bg-background p-0">
            <div className="mb-12 border-s-2 border-accent ps-8">
              <h2 className="text-3xl font-medium tracking-tight text-primary uppercase">{isAr ? "تقديم طلب اهتمام" : "Submit Inquiry"}</h2>
              <p className="text-sm font-light text-muted-foreground mt-4">{isAr ? "سيقوم فريق الحوكمة بمراجعة طلبكم والرد خلال ساعات العمل." : "Our governance team will review and respond during business hours."}</p>
            </div>

            {submitted ? (
              <div className="flex flex-col items-center justify-center py-20 text-center border border-border/40 bg-muted/20">
                <CheckCircle2 className="h-12 w-12 text-accent mb-6" strokeWidth={1} />
                <h3 className="text-2xl font-medium text-primary uppercase tracking-wider mb-4">{isAr ? "تم الاستلام بنجاح" : "Inquiry Received"}</h3>
                <p className="text-base font-light text-muted-foreground mb-10">{isAr ? "نشكركم على اهتمامكم، سيتم التواصل معكم قريباً." : "Thank you for your interest, we will contact you shortly."}</p>
                <button onClick={() => { setSubmitted(false); setForm({ name: "", email: "", subject: "", message: "" }); }} className="text-xs font-bold uppercase tracking-widest text-accent border-b border-accent pb-1">
                  {isAr ? "إرسال استفسار آخر" : "Send Another Inquiry"}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid gap-8 sm:grid-cols-2">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-primary/50">{isAr ? "الاسم الرباعي" : "Full Name"}</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={isAr ? "باللغة العربية أو الإنجليزية" : "In Arabic or English"} required className={inputClasses} />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-primary/50">{isAr ? "البريد الإلكتروني الرسمي" : "Official Email"}</Label>
                    <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="office@company.sa" dir="ltr" required className={inputClasses} />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-primary/50">{isAr ? "طبيعة الاستفسار" : "Subject of Interest"}</Label>
                  <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder={isAr ? "مثلاً: تطوير أرض، شراكة استثمارية" : "e.g., Land Development, Investment Partnership"} className={inputClasses} />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-primary/50">{isAr ? "التفاصيل" : "Detailed Inquiry"}</Label>
                  <Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder={isAr ? "يرجى تقديم تفاصيل أولية حول طلبكم..." : "Please provide initial details regarding your request..."} rows={8} required className="rounded-none border border-border bg-background px-6 py-4 text-primary focus:border-accent focus:ring-1 focus:ring-accent transition-all resize-none" />
                </div>
                <button type="submit" className="w-full flex items-center justify-center gap-4 bg-primary h-16 text-[11px] font-bold uppercase tracking-[0.3em] text-white transition-all hover:bg-accent hover:text-primary" disabled={loading}>
                  {loading ? (isAr ? "جاري الإرسال..." : "Processing...") : (isAr ? "إرسال الطلب الآن" : "Submit Request Now")}
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            )}
          </motion.div>

          {/* Institutional Info Column */}
          <div className="lg:col-span-5 space-y-12">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bg-primary p-12 text-white relative h-full">
              <div className="luxury-grid absolute inset-0 opacity-10 pointer-events-none" />
              <div className="relative z-10">
                <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-accent mb-12">{isAr ? "الاتصال المؤسسي" : "Corporate Contact"}</h3>
                
                <div className="space-y-12">
                  <div className="flex items-start gap-6">
                    <MapPin className="h-5 w-5 text-accent mt-1" strokeWidth={1.5} />
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">{isAr ? "المقر الرئيسي" : "Headquarters"}</h4>
                      <p className="text-sm font-light leading-relaxed">{isAr ? "الرياض، المملكة العربية السعودية" : "Riyadh, Kingdom of Saudi Arabia"}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-6">
                    <Clock className="h-5 w-5 text-accent mt-1" strokeWidth={1.5} />
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">{isAr ? "أوقات العمل" : "Operation Hours"}</h4>
                      <p className="text-sm font-light leading-relaxed">{isAr ? "الأحد — الخميس: ٩:٠٠ ص — ٤:٠٠ م" : "Sunday — Thursday: 9:00 AM — 4:00 PM"}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-6">
                    <Building2 className="h-5 w-5 text-accent mt-1" strokeWidth={1.5} />
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">{isAr ? "للمطورين المعتمدين" : "Certified Developers"}</h4>
                      <Link to="/auth/login" className="text-sm font-bold border-b border-accent pb-1 text-accent hover:text-white hover:border-white transition-all">
                        {isAr ? "ولوج بوابة النظام" : "System Access Portal"}
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="mt-20 pt-12 border-t border-white/10 overflow-hidden h-64 grayscale opacity-60">
                  <iframe src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d432.7034625093088!2d46.63614764513629!3d24.83374433078794!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e1!3m2!1sar!2ssa!4v1771817187352!5m2!1sar!2ssa" width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="SYNA Location" />
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
