import React, { useState } from "react";
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
  usePageTitle(isAr ? "اتصل بنا" : "Contact Us");
  const { toast } = useToast();

  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const workingHours = [
    { day: isAr ? "الأحد" : "Sunday", hours: isAr ? "٩:٠٠ ص — ٤:٠٠ م" : "9:00 AM — 4:00 PM", open: true },
    { day: isAr ? "الإثنين" : "Monday", hours: isAr ? "٩:٠٠ ص — ٤:٠٠ م" : "9:00 AM — 4:00 PM", open: true },
    { day: isAr ? "الثلاثاء" : "Tuesday", hours: isAr ? "٩:٠٠ ص — ٤:٠٠ م" : "9:00 AM — 4:00 PM", open: true },
    { day: isAr ? "الأربعاء" : "Wednesday", hours: isAr ? "٩:٠٠ ص — ٤:٠٠ م" : "9:00 AM — 4:00 PM", open: true },
    { day: isAr ? "الخميس" : "Thursday", hours: isAr ? "٩:٠٠ ص — ٤:٠٠ م" : "9:00 AM — 4:00 PM", open: true },
    { day: isAr ? "الجمعة" : "Friday", hours: isAr ? "مغلق" : "Closed", open: false },
    { day: isAr ? "السبت" : "Saturday", hours: isAr ? "مغلق" : "Closed", open: false },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast({ variant: "destructive", title: isAr ? "يرجى تعبئة جميع الحقول المطلوبة" : "Please fill all required fields" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke("send-contact", { body: form });
      if (error) throw error;
      setSubmitted(true);
      toast({ title: isAr ? "تم إرسال رسالتك بنجاح" : "Your message has been sent successfully" });
    } catch (err: any) {
      toast({ variant: "destructive", title: isAr ? "حدث خطأ" : "Error", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = "h-12 rounded-xl border border-border/50 bg-background text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <PageHeader icon={Send} title={isAr ? "تواصل معنا" : "Contact Us"} description={isAr ? "أرسل لنا رسالتك وسنرد عليك في أقرب وقت ممكن" : "Send us your message and we'll get back to you as soon as possible"} backgroundImage={headerContactImg} />

      <main className="container flex-1 py-16 md:py-24">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Contact Form */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card p-8 shadow-sm">
            <div className="flex items-center gap-4 mb-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-primary">
                <Send className="h-6 w-6" strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="text-xl font-medium text-foreground">{isAr ? "أرسل رسالة" : "Send a Message"}</h2>
                <p className="text-sm font-light text-muted-foreground">{isAr ? "سنتواصل معك في أقرب وقت" : "We'll get back to you shortly"}</p>
              </div>
            </div>

            {submitted ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                  <CheckCircle2 className="h-10 w-10 text-primary" strokeWidth={1.5} />
                </div>
                <h3 className="mb-3 text-2xl font-medium text-foreground">{isAr ? "تم إرسال رسالتك بنجاح!" : "Message Sent Successfully!"}</h3>
                <p className="text-base font-light text-muted-foreground mb-8">{isAr ? "شكراً لتواصلك معنا، سنرد عليك قريباً" : "Thank you for reaching out, we'll respond soon"}</p>
                <Button variant="outline" onClick={() => { setSubmitted(false); setForm({ name: "", email: "", subject: "", message: "" }); }} className="h-12 px-8">
                  {isAr ? "إرسال رسالة أخرى" : "Send Another Message"}
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2.5">
                    <Label className="text-sm font-medium text-foreground">{isAr ? "الاسم *" : "Name *"}</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={isAr ? "اسمك الكامل" : "Your full name"} required className={inputClasses} />
                  </div>
                  <div className="space-y-2.5">
                    <Label className="text-sm font-medium text-foreground">{isAr ? "البريد الإلكتروني *" : "Email *"}</Label>
                    <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="example@email.com" dir="ltr" required className={inputClasses} />
                  </div>
                </div>
                <div className="space-y-2.5">
                  <Label className="text-sm font-medium text-foreground">{isAr ? "الموضوع" : "Subject"}</Label>
                  <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder={isAr ? "موضوع الرسالة" : "Message subject"} className={inputClasses} />
                </div>
                <div className="space-y-2.5">
                  <Label className="text-sm font-medium text-foreground">{isAr ? "الرسالة *" : "Message *"}</Label>
                  <Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder={isAr ? "اكتب رسالتك هنا..." : "Write your message here..."} rows={6} required className="rounded-xl border border-border/50 bg-background text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all resize-none p-4" />
                </div>
                <Button type="submit" className="w-full gap-2 h-12 rounded-xl text-base mt-2" disabled={loading}>
                  <Send className="h-4 w-4" />
                  {loading ? (isAr ? "جاري الإرسال..." : "Sending...") : (isAr ? "إرسال الرسالة" : "Send Message")}
                </Button>
              </form>
            )}
          </motion.div>

          {/* Right Column */}
          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl border border-border bg-card p-8 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-primary">
                  <Clock className="h-6 w-6" strokeWidth={1.5} />
                </div>
                <div>
                  <h2 className="text-xl font-medium text-foreground">{isAr ? "ساعات العمل" : "Working Hours"}</h2>
                  <p className="text-sm font-light text-muted-foreground">{isAr ? "أوقات الدوام الرسمية" : "Official business hours"}</p>
                </div>
              </div>
              <div className="space-y-2">
                {workingHours.map((item) => (
                  <div key={item.day} className={`flex items-center justify-between rounded-xl px-4 py-3 border ${item.open ? "bg-muted/30 border-border/40" : "bg-destructive/5 border-destructive/10"}`}>
                    <span className="text-sm font-medium text-foreground">{item.day}</span>
                    <span className={`text-sm font-medium ${item.open ? "text-primary" : "text-destructive"}`}>{item.hours}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl border border-border bg-card p-8 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-primary">
                  <Building2 className="h-6 w-6" strokeWidth={1.5} />
                </div>
                <div>
                  <h2 className="text-xl font-medium text-foreground">{isAr ? "المقر الرئيسي" : "Head Office"}</h2>
                  <p className="text-sm font-light text-muted-foreground">{isAr ? "موقع مكتبنا" : "Our office location"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 mb-6 rounded-xl border border-border/40 bg-muted/30 p-4">
                <MapPin className="h-5 w-5 text-primary mt-0.5 shrink-0" strokeWidth={1.5} />
                <p className="text-sm font-light text-foreground leading-relaxed">{isAr ? "الرياض، المملكة العربية السعودية" : "Riyadh, Kingdom of Saudi Arabia"}</p>
              </div>
              <div className="overflow-hidden rounded-xl border border-border/50 h-[220px]">
                <iframe src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d432.7034625093088!2d46.63614764513629!3d24.83374433078794!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e1!3m2!1sar!2ssa!4v1771817187352!5m2!1sar!2ssa" width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title={isAr ? "موقع المقر" : "Office Location"} className="w-full h-full grayscale opacity-90" />
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
