import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Link } from "react-router-dom";
import { Mail, MapPin, ArrowUpRight } from "lucide-react";
import logoImg from "@/assets/logo.png";

const Footer: React.FC = () => {
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";

  const sections = [
    {
      title: isAr ? "عن سينا" : "About SYNA",
      links: [
        { to: "/about", label: isAr ? "الرؤية والرسالة" : "Vision & Mission" },
        { to: "/faq", label: isAr ? "الأسئلة الشائعة" : "FAQ" },
        { to: "/subscriptions", label: isAr ? "باقة الخدمات" : "Service Packages" },
      ]
    },
    {
      title: isAr ? "الشركاء" : "Stakeholders",
      links: [
        { to: "/about#owners", label: isAr ? "ملاك الأراضي" : "Landholders" },
        { to: "/about#developers", label: isAr ? "المطورين العقاريين" : "Developers" },
        { to: "/about#investors", label: isAr ? "المستثمرين" : "Investors" },
      ]
    },
    {
      title: isAr ? "القانونية" : "Legal",
      links: [
        { to: "/terms", label: t.nav.terms },
        { to: "/privacy", label: t.nav.privacy },
        { to: "/usage-policy", label: t.nav.usage },
      ]
    }
  ];

  return (
    <footer className="relative bg-primary text-primary-foreground pt-24 pb-12 overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-accent/5 skew-x-[-12deg] translate-x-1/2 pointer-events-none" />
      <div className="luxury-grid absolute inset-0 opacity-10 pointer-events-none" />

      <div className="container relative z-10">
        <div className="grid gap-16 md:grid-cols-12 border-b border-white/10 pb-20">
          {/* Brand & Corporate */}
          <div className="md:col-span-4">
            <Link to="/" className="flex items-center gap-4 mb-8">
              <img src={logoImg} alt="SYNA" className="h-14 w-14 object-contain brightness-0 invert" />
              <div className="flex flex-col leading-tight">
                <span className="text-2xl font-semibold tracking-widest uppercase">SYNA</span>
                <span className="text-[9px] uppercase tracking-[0.3em] text-accent font-bold">
                  {isAr ? "للاستثمارات العقارية" : "Real Estate Investments"}
                </span>
              </div>
            </Link>
            <p className="max-w-sm text-sm font-light leading-relaxed text-primary-foreground/60 mb-10 text-balance">
              {isAr 
                ? "كيان استثماري عقاري مؤسسي يعمل على تمكين التحول العمراني في المملكة العربية السعودية من خلال ربط الفرص النوعية بالمطورين الموثوقين والمستثمرين الاستراتيجيين."
                : "An institutional real estate investment entity empowering urban transformation in Saudi Arabia by connecting quality opportunities with trusted developers and strategic investors."}
            </p>
            <div className="flex flex-col gap-5">
              <a href="mailto:info@syna.sa" className="flex items-center gap-4 text-sm font-medium transition-colors hover:text-accent">
                <div className="flex h-10 w-10 items-center justify-center border border-white/10 bg-white/5">
                  <Mail className="h-4 w-4" />
                </div>
                <span>info@syna.sa</span>
              </a>
              <div className="flex items-center gap-4 text-sm font-medium text-primary-foreground/80">
                <div className="flex h-10 w-10 items-center justify-center border border-white/10 bg-white/5">
                  <MapPin className="h-4 w-4" />
                </div>
                <span>{isAr ? "الرياض، المملكة العربية السعودية" : "Riyadh, Saudi Arabia"}</span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="md:col-span-5 grid grid-cols-2 md:grid-cols-3 gap-8">
            {sections.map((section) => (
              <div key={section.title}>
                <h4 className="mb-8 text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
                  {section.title}
                </h4>
                <div className="flex flex-col gap-5">
                  {section.links.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      className="text-xs font-medium text-primary-foreground/50 transition-colors hover:text-primary-foreground"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Newsletter/Inquiry */}
          <div className="md:col-span-3">
            <h4 className="mb-8 text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
              {isAr ? "تواصل تنفيذي" : "Executive Inquiry"}
            </h4>
            <p className="mb-8 text-xs font-light leading-relaxed text-primary-foreground/50">
              {isAr
                ? "للاستفسارات الرسمية بشأن الشراكات الاستثمارية أو تطوير الأراضي."
                : "For official inquiries regarding investment partnerships or land development."}
            </p>
            <Link
              to="/contact"
              className="flex w-full items-center justify-between border border-accent/40 bg-accent/5 px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-accent transition-all hover:bg-accent hover:text-primary"
            >
              {isAr ? "تقديم طلب اهتمام" : "Submit Interest"}
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Legal Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-6 md:flex-row">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-foreground/30" dir="ltr">
            {isAr
              ? `© ${new Date().getFullYear()} SYNA REAL ESTATE INVESTMENTS. ALL RIGHTS RESERVED.`
              : `© ${new Date().getFullYear()} SYNA REAL ESTATE INVESTMENTS. ALL RIGHTS RESERVED.`}
          </p>
          <div className="flex items-center gap-8 text-[10px] font-bold uppercase tracking-[0.2em] text-primary-foreground/30">
            <span>RIYADH</span>
            <span>SAUDI ARABIA</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
