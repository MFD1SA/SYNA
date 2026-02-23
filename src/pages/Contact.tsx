import React, { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Clock, MapPin, Building2, Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
      const { error } = await supabase.functions.invoke("send-contact", {
        body: form,
      });
      if (error) throw error;
      setSubmitted(true);
      toast({ title: isAr ? "تم إرسال رسالتك بنجاح" : "Your message has been sent successfully" });
    } catch (err: any) {
      toast({ variant: "destructive", title: isAr ? "حدث خطأ" : "Error", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Header */}
      <div className="relative w-full overflow-hidden bg-[hsl(210,25%,8%)]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 end-[-10%] h-[400px] w-[400px] rounded-full bg-[hsl(187,65%,28%,0.08)] blur-[120px]" />
          <div className="absolute -bottom-32 start-[-8%] h-[300px] w-[300px] rounded-full bg-[hsl(40,72%,52%,0.06)] blur-[100px]" />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `radial-gradient(circle, hsl(187 65% 60%) 0.5px, transparent 0.5px)`,
              backgroundSize: "48px 48px",
            }}
          />
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[hsl(210,25%,8%)] to-transparent" />
        </div>
        <div className="container relative z-10 py-16 md:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-4 inline-flex items-center justify-center rounded-full border border-[hsl(187,55%,40%,0.3)] bg-[hsl(187,55%,40%,0.1)] p-3">
              <Send className="h-6 w-6 text-[hsl(187,55%,50%)]" strokeWidth={1.5} />
            </div>
            <h1 className="mb-3 text-3xl font-medium text-white md:text-4xl">
              {isAr ? "تواصل معنا" : "Contact Us"}
            </h1>
            <p className="text-base font-light leading-relaxed text-[hsl(210,15%,60%)]">
              {isAr
                ? "أرسل لنا رسالتك وسنرد عليك في أقرب وقت ممكن"
                : "Send us your message and we'll get back to you as soon as possible"}
            </p>
          </div>
        </div>
      </div>

      <main className="container py-12 md:py-16">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Contact Form */}
          <div className="rounded-2xl border border-border/60 bg-card p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Send className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-medium text-foreground">
                  {isAr ? "أرسل رسالة" : "Send a Message"}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {isAr ? "سنتواصل معك في أقرب وقت" : "We'll get back to you shortly"}
                </p>
              </div>
            </div>

            {submitted ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <CheckCircle2 className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-medium text-foreground">
                  {isAr ? "تم إرسال رسالتك بنجاح!" : "Message Sent Successfully!"}
                </h3>
                <p className="text-sm font-light text-muted-foreground mb-4">
                  {isAr ? "شكراً لتواصلك معنا، سنرد عليك قريباً" : "Thank you for reaching out, we'll respond soon"}
                </p>
                <Button variant="outline" onClick={() => { setSubmitted(false); setForm({ name: "", email: "", subject: "", message: "" }); }}>
                  {isAr ? "إرسال رسالة أخرى" : "Send Another Message"}
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{isAr ? "الاسم *" : "Name *"}</Label>
                    <Input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder={isAr ? "اسمك الكامل" : "Your full name"}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{isAr ? "البريد الإلكتروني *" : "Email *"}</Label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder={isAr ? "example@email.com" : "example@email.com"}
                      dir="ltr"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{isAr ? "الموضوع" : "Subject"}</Label>
                  <Input
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    placeholder={isAr ? "موضوع الرسالة" : "Message subject"}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{isAr ? "الرسالة *" : "Message *"}</Label>
                  <Textarea
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder={isAr ? "اكتب رسالتك هنا..." : "Write your message here..."}
                    rows={5}
                    required
                  />
                </div>
                <Button type="submit" className="w-full gap-2 doma-gradient doma-shadow-lg h-11 rounded-xl" disabled={loading}>
                  <Send className="h-4 w-4" />
                  {loading ? (isAr ? "جاري الإرسال..." : "Sending...") : (isAr ? "إرسال الرسالة" : "Send Message")}
                </Button>
              </form>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Working Hours */}
            <div className="rounded-2xl border border-border/60 bg-card p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-medium text-foreground">
                    {isAr ? "ساعات العمل" : "Working Hours"}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {isAr ? "أوقات الدوام الرسمية" : "Official business hours"}
                  </p>
                </div>
              </div>
              <div className="space-y-1">
                {workingHours.map((item) => (
                  <div
                    key={item.day}
                    className={`flex items-center justify-between rounded-xl px-4 py-3 transition-colors ${
                      item.open ? "bg-muted/30" : "bg-destructive/5"
                    }`}
                  >
                    <span className="text-sm font-medium text-foreground">{item.day}</span>
                    <span className={`text-sm ${item.open ? "text-primary font-medium" : "text-destructive font-medium"}`}>
                      {item.hours}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Office Info */}
            <div className="rounded-2xl border border-border/60 bg-card p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-medium text-foreground">
                    {isAr ? "المقر الرئيسي" : "Head Office"}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {isAr ? "موقع مكتبنا" : "Our office location"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2 mb-4 rounded-xl bg-muted/30 p-4">
                <MapPin className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {isAr
                    ? "الرياض، المملكة العربية السعودية"
                    : "Riyadh, Kingdom of Saudi Arabia"}
                </p>
              </div>
              <div className="overflow-hidden rounded-xl border border-border/40 h-[220px]">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d432.7034625093088!2d46.63614764513629!3d24.83374433078794!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e1!3m2!1sar!2ssa!4v1771817187352!5m2!1sar!2ssa"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={isAr ? "موقع المقر" : "Office Location"}
                  className="w-full h-full"
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
