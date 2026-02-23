import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Phone, Mail, Clock, MapPin, MessageCircle, Building2, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";

const Contact: React.FC = () => {
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  const whatsappUrl = "https://wa.me/966504566777";

  const workingHours = [
    { day: isAr ? "الأحد" : "Sunday", hours: isAr ? "٩:٠٠ ص — ٤:٠٠ م" : "9:00 AM — 4:00 PM", open: true },
    { day: isAr ? "الإثنين" : "Monday", hours: isAr ? "٩:٠٠ ص — ٤:٠٠ م" : "9:00 AM — 4:00 PM", open: true },
    { day: isAr ? "الثلاثاء" : "Tuesday", hours: isAr ? "٩:٠٠ ص — ٤:٠٠ م" : "9:00 AM — 4:00 PM", open: true },
    { day: isAr ? "الأربعاء" : "Wednesday", hours: isAr ? "٩:٠٠ ص — ٤:٠٠ م" : "9:00 AM — 4:00 PM", open: true },
    { day: isAr ? "الخميس" : "Thursday", hours: isAr ? "٩:٠٠ ص — ٤:٠٠ م" : "9:00 AM — 4:00 PM", open: true },
    { day: isAr ? "الجمعة" : "Friday", hours: isAr ? "مغلق" : "Closed", open: false },
    { day: isAr ? "السبت" : "Saturday", hours: isAr ? "مغلق" : "Closed", open: false },
  ];

  const contactCards = [
    {
      icon: Mail,
      title: isAr ? "البريد الإلكتروني" : "Email",
      value: "info@doma.sa",
      desc: isAr ? "للاستفسارات العامة والشراكات" : "For general inquiries and partnerships",
      href: "mailto:info@doma.sa",
    },
    {
      icon: Headphones,
      title: isAr ? "الدعم الفني" : "Technical Support",
      value: "support@doma.sa",
      desc: isAr ? "للمساعدة التقنية وحل المشكلات" : "For technical help and issue resolution",
      href: "mailto:support@doma.sa",
    },
    {
      icon: MessageCircle,
      title: isAr ? "واتساب" : "WhatsApp",
      value: "0504566777",
      desc: isAr ? "تواصل فوري مع فريقنا" : "Instant communication with our team",
      href: whatsappUrl,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar variant="portfolio" onToggleVariant={() => {}} />

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
              <Phone className="h-6 w-6 text-[hsl(187,55%,50%)]" strokeWidth={1.5} />
            </div>
            <h1 className="mb-3 text-3xl font-medium text-white md:text-4xl">
              {isAr ? "تواصل معنا" : "Contact Us"}
            </h1>
            <p className="text-base font-light leading-relaxed text-[hsl(210,15%,60%)]">
              {isAr
                ? "فريق دوما جاهز لمساعدتك. تواصل معنا عبر أي من القنوات التالية وسنرد عليك في أقرب وقت."
                : "The DOMA team is ready to help. Reach out through any of the channels below and we'll get back to you promptly."}
            </p>
          </div>
        </div>
      </div>

      <main className="container py-12 md:py-16">
        {/* Contact Cards */}
        <div className="grid gap-5 sm:grid-cols-3 mb-12">
          {contactCards.map((card) => (
            <a
              key={card.value}
              href={card.href}
              target={card.href.startsWith("http") ? "_blank" : undefined}
              rel={card.href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="group rounded-2xl border border-border/60 bg-card p-6 text-center transition-all duration-200 hover:border-primary/30 hover:shadow-lg"
            >
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                <card.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-sm font-medium text-foreground mb-1">{card.title}</h3>
              <p className="text-lg font-medium text-primary mb-1" dir="ltr">{card.value}</p>
              <p className="text-xs text-muted-foreground">{card.desc}</p>
            </a>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
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

            {/* WhatsApp CTA */}
            <div className="mt-6">
              <Button asChild className="w-full gap-2 doma-gradient doma-shadow-lg h-12 text-base rounded-xl">
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-5 w-5" />
                  {isAr ? "تواصل عبر واتساب" : "Chat on WhatsApp"}
                </a>
              </Button>
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
            {/* Map Embed */}
            <div className="overflow-hidden rounded-xl border border-border/40 h-[280px]">
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
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
