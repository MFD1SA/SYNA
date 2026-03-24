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
    <footer className="relative bg-primary text-white pt-32 pb-16 overflow-hidden border-t border-white/5">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-accent/[0.02] skew-x-[-15deg] translate-x-1/4 pointer-events-none" />
      <div className="luxury-grid absolute inset-0 opacity-10 pointer-events-none" />

      <div className="container relative z-10">
        <div className="grid gap-20 lg:grid-cols-12 pb-24">
          {/* Brand & Corporate */}
          <div className="lg:col-span-5">
            <Link to="/" className="flex items-center gap-6 mb-12 group">
              <img src={logoImg} alt="SYNA" className="h-16 w-16 object-contain brightness-0 invert opacity-80 group-hover:opacity-100 transition-opacity" />
              <div className="flex flex-col leading-tight border-s border-white/10 ps-6">
                <span className="text-3xl font-medium tracking-[0.2em] uppercase">SYNA</span>
                <span className="text-[10px] uppercase tracking-[0.4em] text-accent font-bold">
                  {isAr ? "للاستثمارات العقارية" : "Real Estate Investments"}
                </span>
              </div>
            </Link>
            <p className="max-w-md text-sm font-light leading-[1.8] text-white/40 mb-12 text-balance">
              {isAr 
                ? "كيان سيادي في منظومة الاستثمار العقاري، نختص في إدارة وتأجير العقارات المملوكة، وتمكين الشراكات الاستراتيجية النوعية التي ترتقي بالمشهد الصب في العاصمة الرياض."
                : "A sovereign entity in the real estate investment ecosystem, specializing in asset management and enabling strategic partnerships that elevate the urban landscape of Riyadh."}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <a href="mailto:info@cidoma.com" className="flex items-center gap-5 group transition-colors">
                <div className="flex h-12 w-12 items-center justify-center border border-white/10 bg-white/5 transition-colors group-hover:border-accent/40 group-hover:bg-accent/5">
                  <Mail className="h-4 w-4 text-accent/60 group-hover:text-accent" strokeWidth={1.5} />
                </div>
                <span className="text-xs font-bold tracking-widest opacity-60 group-hover:opacity-100">INFO@CIDOMA.COM</span>
              </a>
              <div className="flex items-center gap-5">
                <div className="flex h-12 w-12 items-center justify-center border border-white/10 bg-white/5">
                  <MapPin className="h-4 w-4 text-accent/60" strokeWidth={1.5} />
                </div>
                <span className="text-xs font-bold tracking-widest opacity-60">{isAr ? "الرياض، المملكة" : "RIYADH, KSA"}</span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="lg:col-span-4 grid grid-cols-2 gap-12">
            {sections.slice(0, 2).map((section) => (
              <div key={section.title}>
                <h4 className="mb-10 text-[10px] font-bold uppercase tracking-[0.4em] text-accent">
                  {section.title}
                </h4>
                <div className="flex flex-col gap-6">
                  {section.links.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/30 transition-all hover:text-white hover:ps-2"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Newsletter/Inquiry */}
          <div className="lg:col-span-3">
            <h4 className="mb-10 text-[10px] font-bold uppercase tracking-[0.4em] text-accent">
              {isAr ? "النفاذ للمراسلات" : "Executive Desk"}
            </h4>
            <p className="mb-10 text-xs font-light leading-relaxed text-white/40">
              {isAr
                ? "للاستفسارات الرسمية بشأن الشراكات الاستثمارية الاستراتيجية."
                : "For official executive inquiries regarding strategic investment mandates."}
            </p>
            <Link
              to="/contact"
              className="luxury-button w-full h-14 border-white/10 text-white hover:border-accent hover:bg-accent hover:text-primary"
            >
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{isAr ? "تقديم طلب اهتمام" : "Submit Mandate"}</span>
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Legal Bottom bar */}
        <div className="pt-12 border-t border-white/5 flex flex-col items-center justify-between gap-8 md:flex-row">
          <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-white/20" dir="ltr">
            © {new Date().getFullYear()} SYNA REAL ESTATE INVESTMENTS. INSTITUTIONAL SOVEREIGNTY.
          </p>
          <div className="flex items-center gap-12 text-[9px] font-bold uppercase tracking-[0.4em] text-white/20">
            <Link to="/terms" className="hover:text-accent transition-colors">TERMS</Link>
            <Link to="/privacy" className="hover:text-accent transition-colors">PRIVACY</Link>
            <div className="h-4 w-px bg-white/5" />
            <span className="text-white/40">HEADQUARTERS: RIYADH</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
