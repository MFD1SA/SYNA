import React, { useEffect, useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, Landmark, Building2, ShieldCheck,
  Sparkles, CheckCircle2, TrendingUp, Users,
} from "lucide-react";
import cityRiyadhImg from "@/assets/city-riyadh.jpg";
import { getHeroImage } from "@/services/siteSettings.service";
import { useHeroImage } from "@/hooks/useHeroImage";

const HeroSection: React.FC = () => {
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";
  const navigate = useNavigate();
  const Arrow = isAr ? ArrowLeft : ArrowRight;
  const [bgImage, setBgImage] = useState<string>(cityRiyadhImg);

  const { heroImage: dynamicHero } = useHeroImage("home");

  useEffect(() => {
    getHeroImage().then((img) => {
      if (img?.url) setBgImage(img.url);
    });
  }, []);

  const resolvedBg = dynamicHero?.desktop || bgImage;

  const highlights = isAr
    ? ["حوكمة كاملة", "خصوصية محمية", "شفافية مطلقة"]
    : ["Full Governance", "Protected Privacy", "Absolute Transparency"];

  return (
    <div
      className="relative min-h-[90vh] md:min-h-[94vh] flex items-center overflow-hidden"
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* Background image */}
      <div className="absolute inset-0">
        <picture>
          {dynamicHero?.mobile && (
            <source media="(max-width: 768px)" srcSet={dynamicHero.mobile} />
          )}
          <img
            src={resolvedBg}
            alt={isAr ? (dynamicHero?.alt_ar || "") : (dynamicHero?.alt_en || "")}
            className="w-full h-full object-cover scale-105"
            style={{ filter: "brightness(0.42) saturate(0.85)" }}
          />
        </picture>
        {/* Deep overlay gradient */}
        <div
          className={`absolute inset-0 ${
            isAr
              ? "bg-gradient-to-l from-[#0A1520]/55 via-[#0F1F2E]/85 to-[#0A1520]/97"
              : "bg-gradient-to-r from-[#0A1520]/97 via-[#0F1F2E]/85 to-[#0A1520]/55"
          }`}
        />
        {/* Mobile: stronger vertical overlay */}
        <div className="md:hidden absolute inset-0 bg-gradient-to-b from-[#0A1520]/60 via-[#0F1F2E]/80 to-[#0A1520]/95" />
        {/* Vignette */}
        <div className="hidden md:block absolute inset-0 bg-gradient-to-b from-[#0A1520]/50 via-transparent to-[#0A1520]/70" />
      </div>

      {/* Decorative noise pattern */}
      <div
        className="absolute inset-0 z-[2] opacity-[0.03]"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Glow blobs */}
      <div className="absolute inset-0 z-[2] pointer-events-none">
        <div className="absolute top-20 end-10 md:end-20 w-64 md:w-96 h-64 md:h-96 rounded-full bg-[#C2A86B]/10 blur-[80px] md:blur-[100px] animate-pulse" style={{ animationDuration: "8s" }} />
        <div className="absolute bottom-10 start-0 md:start-10 w-80 md:w-[500px] h-80 md:h-[500px] rounded-full bg-[#2B4C66]/20 blur-[100px] md:blur-[120px]" />
      </div>

      {/* Content */}
      <div className="container relative z-[10] py-20 md:py-24 lg:py-32">
        <div className="max-w-3xl">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 mb-5 md:mb-8 px-3 md:px-4 py-1.5 md:py-2 rounded-full border border-white/15 bg-white/5 backdrop-blur-md">
            <div className="flex items-center justify-center w-4 md:w-5 h-4 md:h-5 rounded-full bg-gradient-to-br from-[#C2A86B] to-[#A88A4A]">
              <Sparkles className="w-2 md:w-2.5 h-2 md:h-2.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-[10px] md:text-[11px] font-semibold tracking-[0.12em] md:tracking-[0.14em] uppercase text-white/85">
              {isAr ? "منصة سعودية احترافية" : "Professional Saudi Platform"}
            </span>
          </div>

          <h1 className="text-[34px] sm:text-[44px] md:text-[60px] lg:text-[76px] font-bold text-white leading-[1.08] md:leading-[1.05] tracking-tight mb-4 md:mb-6">
            {t.hero.title}
          </h1>

          {/* Accent gradient rule */}
          <div className="mb-5 md:mb-7 h-1 w-14 md:w-20 rounded-full bg-gradient-to-r from-[#C2A86B] via-[#D7C084] to-transparent" />

          <p className="text-[15px] sm:text-[17px] md:text-[19px] text-white/75 leading-[1.75] md:leading-[1.7] mb-7 md:mb-10 max-w-2xl">
            {t.hero.subtitle}
          </p>

          {/* Highlights row — horizontal scroll on mobile */}
          <div className="flex flex-wrap gap-x-4 md:gap-x-6 gap-y-2 md:gap-y-3 mb-8 md:mb-12">
            {highlights.map((h, i) => (
              <div key={i} className="flex items-center gap-1.5 md:gap-2 text-[12px] md:text-[13px] text-white/85">
                <CheckCircle2 className="w-3.5 md:w-4 h-3.5 md:h-4 text-[#D7C084] shrink-0" strokeWidth={2} />
                <span className="font-medium">{h}</span>
              </div>
            ))}
          </div>

          {/* CTAs — stack on mobile */}
          <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
            <button
              onClick={() => navigate("/auth/login?type=owner")}
              className="group relative inline-flex items-center justify-center gap-3 h-[54px] md:h-[56px] px-6 md:px-8 bg-white text-[#1E374B] text-[13.5px] md:text-[14px] font-bold rounded-2xl shadow-[0_10px_40px_-12px_rgba(255,255,255,0.25)] hover:shadow-[0_14px_44px_-10px_rgba(255,255,255,0.4)] hover:-translate-y-0.5 transition-all duration-300"
            >
              <Landmark className="w-5 h-5 text-[#2B4C66] group-hover:text-[#A88A4A] transition-colors" strokeWidth={1.7} />
              {isAr ? "دخول الملاك" : "Owner Login"}
              <Arrow className="w-4 h-4 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" strokeWidth={2} />
            </button>
            <button
              onClick={() => navigate("/auth/login")}
              className="group inline-flex items-center justify-center gap-3 h-[54px] md:h-[56px] px-6 md:px-8 bg-white/[0.08] border border-white/20 backdrop-blur-md text-white text-[13.5px] md:text-[14px] font-bold rounded-2xl hover:bg-white/[0.14] hover:border-white/40 hover:-translate-y-0.5 transition-all duration-300"
            >
              <Building2 className="w-5 h-5 text-[#D7C084]" strokeWidth={1.7} />
              {isAr ? "دخول المطورين" : "Developer Login"}
              <Arrow className="w-4 h-4 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" strokeWidth={2} />
            </button>
          </div>

          {/* Trust micro-indicator */}
          <div className="mt-8 md:mt-12 flex items-start gap-2 text-[11px] md:text-[12px] text-white/55 leading-relaxed">
            <ShieldCheck className="w-3.5 md:w-4 h-3.5 md:h-4 text-[#D7C084] shrink-0 mt-0.5" strokeWidth={1.8} />
            <span>
              {isAr
                ? "مرخّصة من الهيئة العامة للعقار (REGA) • حماية بيانات وفق أنظمة المملكة"
                : "Licensed by REGA • Compliant with Saudi data protection laws"}
            </span>
          </div>

          {/* Mobile-only stats pills */}
          <div className="lg:hidden mt-8 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/15 bg-white/[0.06] backdrop-blur-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-3.5 h-3.5 text-[#D7C084]" strokeWidth={2} />
                <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-white/60">
                  {isAr ? "فرص متاحة" : "Opportunities"}
                </p>
              </div>
              <p className="text-[22px] font-bold text-white leading-none" dir="ltr">150+</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/[0.06] backdrop-blur-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-3.5 h-3.5 text-[#D7C084]" strokeWidth={2} />
                <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-white/60">
                  {isAr ? "مطورون معتمدون" : "Verified Devs"}
                </p>
              </div>
              <p className="text-[22px] font-bold text-white leading-none" dir="ltr">60+</p>
            </div>
          </div>
        </div>

        {/* Floating right-side card (desktop only) */}
        <div className="hidden lg:block absolute end-10 top-1/2 -translate-y-1/2 w-[300px] rounded-3xl border border-white/15 bg-white/[0.06] backdrop-blur-xl p-6 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-white/70">
              {isAr ? "نشط الآن" : "Live Now"}
            </span>
          </div>
          <p className="text-[13px] text-white/85 leading-relaxed mb-5">
            {isAr
              ? "فرص تطويرية جديدة تُضاف يومياً في أبرز مدن المملكة بتقييم احترافي."
              : "Fresh development opportunities added daily in the Kingdom's major cities."}
          </p>
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <TrendingUp className="w-3 h-3 text-[#D7C084]" strokeWidth={2.2} />
                <p className="text-[10px] text-white/50 font-bold uppercase tracking-wider">
                  {isAr ? "فرص" : "Deals"}
                </p>
              </div>
              <p className="text-[22px] font-bold text-white" dir="ltr">150+</p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Users className="w-3 h-3 text-[#D7C084]" strokeWidth={2.2} />
                <p className="text-[10px] text-white/50 font-bold uppercase tracking-wider">
                  {isAr ? "مطورون" : "Devs"}
                </p>
              </div>
              <p className="text-[22px] font-bold text-white" dir="ltr">60+</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute inset-x-0 bottom-0 z-[4] h-16 md:h-20 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />
    </div>
  );
};

export default HeroSection;
