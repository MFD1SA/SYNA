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

  const inputClasses = "h-11 rounded-xl border-[hsl(210,22%,16%)] bg-[hsl(210,28%,8%)] text-white placeholder:text-[hsl(210,15%,35%)] focus:border-[hsl(200,80%,45%,0.4)] focus:ring-[hsl(200,80%,45%,0.2)]";

  return (
    <div className="min-h-screen bg-[hsl(210,30%,4%)]">
      <Navbar />
      <PageHeader icon={Send} title={isAr ? "تواصل معنا" : "Contact Us"} description={isAr ? "أرسل لنا رسالتك وسنرد عليك في أقرب وقت ممكن" : "Send us your message and we'll get back to you as soon as possible"} backgroundImage={headerContactImg} />

      <main className="container py-12 md:py-16">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Contact Form */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-[hsl(210,22%,12%)] bg-[hsl(210,28%,7%)] p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[hsl(200,80%,45%,0.12)] bg-[hsl(200,80%,45%,0.06)]">
                <Send className="h-5 w-5 text-[hsl(200,80%,55%)]" />
              </div>
              <div>
                <h2 className="text-lg font-medium text-white">{isAr ? "أرسل رسالة" : "Send a Message"}</h2>
                <p className="text-xs text-[hsl(210,15%,45%)]">{isAr ? "سنتواصل معك في أقرب وقت" : "We'll get back to you shortly"}</p>
              </div>
            </div>

            {submitted ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[hsl(200,80%,45%,0.2)] bg-[hsl(200,80%,45%,0.06)]">
                  <CheckCircle2 className="h-8 w-8 text-[hsl(200,80%,55%)]" />
                </div>
                <h3 className="mb-2 text-lg font-medium text-white">{isAr ? "تم إرسال رسالتك بنجاح!" : "Message Sent Successfully!"}</h3>
                <p className="text-sm font-light text-[hsl(210,15%,50%)] mb-4">{isAr ? "شكراً لتواصلك معنا، سنرد عليك قريباً" : "Thank you for reaching out, we'll respond soon"}</p>
                <Button variant="outline" onClick={() => { setSubmitted(false); setForm({ name: "", email: "", subject: "", message: "" }); }} className="border-[hsl(210,22%,16%)] bg-transparent text-[hsl(210,15%,70%)] hover:bg-[hsl(210,22%,12%)] hover:text-white">
                  {isAr ? "إرسال رسالة أخرى" : "Send Another Message"}
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-sm text-[hsl(210,15%,60%)]">{isAr ? "الاسم *" : "Name *"}</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={isAr ? "اسمك الكامل" : "Your full name"} required className={inputClasses} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-[hsl(210,15%,60%)]">{isAr ? "البريد الإلكتروني *" : "Email *"}</Label>
                    <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="example@email.com" dir="ltr" required className={inputClasses} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-[hsl(210,15%,60%)]">{isAr ? "الموضوع" : "Subject"}</Label>
                  <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder={isAr ? "موضوع الرسالة" : "Message subject"} className={inputClasses} />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-[hsl(210,15%,60%)]">{isAr ? "الرسالة *" : "Message *"}</Label>
                  <Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder={isAr ? "اكتب رسالتك هنا..." : "Write your message here..."} rows={5} required className="rounded-xl border-[hsl(210,22%,16%)] bg-[hsl(210,28%,8%)] text-white placeholder:text-[hsl(210,15%,35%)] focus:border-[hsl(200,80%,45%,0.4)]" />
                </div>
                <Button type="submit" className="w-full gap-2 syna-gradient h-12 rounded-xl text-base transition-all duration-300 hover:shadow-[0_8px_30px_-8px_hsl(200,80%,50%,0.3)]" disabled={loading}>
                  <Send className="h-4 w-4" />
                  {loading ? (isAr ? "جاري الإرسال..." : "Sending...") : (isAr ? "إرسال الرسالة" : "Send Message")}
                </Button>
              </form>
            )}
          </motion.div>

          {/* Right Column */}
          <div className="space-y-5">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl border border-[hsl(210,22%,12%)] bg-[hsl(210,28%,7%)] p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[hsl(200,80%,45%,0.12)] bg-[hsl(200,80%,45%,0.06)]">
                  <Clock className="h-5 w-5 text-[hsl(200,80%,55%)]" />
                </div>
                <div>
                  <h2 className="text-lg font-medium text-white">{isAr ? "ساعات العمل" : "Working Hours"}</h2>
                  <p className="text-xs text-[hsl(210,15%,45%)]">{isAr ? "أوقات الدوام الرسمية" : "Official business hours"}</p>
                </div>
              </div>
              <div className="space-y-1">
                {workingHours.map((item) => (
                  <div key={item.day} className={`flex items-center justify-between rounded-xl px-4 py-3 ${item.open ? "bg-[hsl(210,22%,10%)]" : "bg-[hsl(0,60%,15%,0.2)]"}`}>
                    <span className="text-sm font-medium text-white">{item.day}</span>
                    <span className={`text-sm font-medium ${item.open ? "text-[hsl(200,80%,55%)]" : "text-[hsl(0,60%,55%)]"}`}>{item.hours}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl border border-[hsl(210,22%,12%)] bg-[hsl(210,28%,7%)] p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[hsl(200,80%,45%,0.12)] bg-[hsl(200,80%,45%,0.06)]">
                  <Building2 className="h-5 w-5 text-[hsl(200,80%,55%)]" />
                </div>
                <div>
                  <h2 className="text-lg font-medium text-white">{isAr ? "المقر الرئيسي" : "Head Office"}</h2>
                  <p className="text-xs text-[hsl(210,15%,45%)]">{isAr ? "موقع مكتبنا" : "Our office location"}</p>
                </div>
              </div>
              <div className="flex items-start gap-2 mb-4 rounded-xl bg-[hsl(210,22%,10%)] p-4">
                <MapPin className="h-5 w-5 text-[hsl(200,80%,55%)] mt-0.5 shrink-0" />
                <p className="text-sm text-[hsl(210,15%,55%)] leading-relaxed">{isAr ? "الرياض، المملكة العربية السعودية" : "Riyadh, Kingdom of Saudi Arabia"}</p>
              </div>
              <div className="overflow-hidden rounded-xl border border-[hsl(210,22%,12%)] h-[200px]">
                <iframe src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d432.7034625093088!2d46.63614764513629!3d24.83374433078794!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e1!3m2!1sar!2ssa!4v1771817187352!5m2!1sar!2ssa" width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title={isAr ? "موقع المقر" : "Office Location"} className="w-full h-full" />
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
