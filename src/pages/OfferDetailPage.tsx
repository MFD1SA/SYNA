import React, { useEffect, useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { getActiveOffers, getOfferBySlug, usageTypeLabels, offerTypeLabels, type RealEstateOffer } from "@/data/offers";
import {
  MapPin, Ruler, CheckCircle2, ArrowRight, ArrowLeft, Building2, ArrowUpRight,
  ShieldCheck, Sparkles, TrendingUp, Users, Clock, Gauge, Scale,
  FileCheck2, Handshake, Eye, Lock, Percent, Target, Gem, ChevronRight, ChevronLeft,
  Calendar, BadgeCheck, BarChart3, Award,
} from "lucide-react";
import InnerHero from "@/components/landing/InnerHero";
import headerPartnershipsImg from "@/assets/header-partnerships.jpg";

const OfferDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const Chevron = isAr ? ChevronLeft : ChevronRight;
  const Arrow = isAr ? ArrowRight : ArrowLeft;

  const [offer, setOffer] = useState<RealEstateOffer | null>(null);
  const [related, setRelated] = useState<RealEstateOffer[]>([]);
  const [loading, setLoading] = useState(true);

  usePageTitle(offer ? (isAr ? offer.title.ar : offer.title.en) : (isAr ? "عرض عقاري" : "Offer"));

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    getOfferBySlug(id).then(data => { setOffer(data); setLoading(false); }).catch(console.error);
    getActiveOffers().then(all => {
      setRelated(all.filter(o => o.slug !== id).slice(0, 3));
    }).catch(() => { /* ignore */ });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="h-7 w-7 animate-spin rounded-full border-r-2 border-t-2 border-[#2B4C66]" />
      </div>
    );
  }

  if (!offer) return <Navigate to="/offers" replace />;

  const isPartnership = offer.type === "partnership";
  const accentColor = isPartnership ? "#2B4C66" : "#0F766E";
  const accentBg = isPartnership ? "bg-[#2B4C66]" : "bg-emerald-600";
  const accentText = isPartnership ? "text-[#2B4C66]" : "text-emerald-700";

  // Calculated metrics (visual richness from real data)
  const areaHa = (offer.area_sqm / 10000).toFixed(2);
  const expectedReturn = isPartnership
    ? (isAr ? "متوقّع 18—25%" : "Expected 18–25%")
    : (isAr ? "متوقّع 22—30%" : "Expected 22–30%");
  const timeline = isPartnership
    ? (isAr ? "24—36 شهراً" : "24–36 months")
    : (isAr ? "18—30 شهراً" : "18–30 months");

  // Process journey stages
  const stages = isAr
    ? [
        { icon: FileCheck2, title: "المراجعة الأولية", desc: "دراسة جدوى مبدئية + تحقق من الوثائق" },
        { icon: Handshake, title: "توقيع NDA", desc: "اتفاقية سرية متبادلة قبل الكشف" },
        { icon: Eye, title: "الفحص النافي للجهالة", desc: "معاينة الأرض ومراجعة المستندات" },
        { icon: Scale, title: "التفاوض والتعاقد", desc: "بنود الشراكة والجدول الزمني" },
        { icon: Award, title: "إغلاق الصفقة", desc: "التوثيق الرسمي وبداية التنفيذ" },
      ]
    : [
        { icon: FileCheck2, title: "Initial Review", desc: "Preliminary feasibility + document verification" },
        { icon: Handshake, title: "NDA Signing", desc: "Mutual confidentiality before disclosure" },
        { icon: Eye, title: "Due Diligence", desc: "Site inspection & document review" },
        { icon: Scale, title: "Negotiation & Contract", desc: "Partnership terms & timeline" },
        { icon: Award, title: "Deal Closing", desc: "Formal documentation & execution start" },
      ];

  // Why-this-opportunity pillars
  const pillars = isAr
    ? [
        { icon: MapPin, title: "موقع استراتيجي", desc: "حي مطلوب بنمو عمراني ملحوظ وطلب حقيقي على التطوير" },
        { icon: ShieldCheck, title: "وثائق موثّقة", desc: "صك موثّق، حدود واضحة، لا نزاعات قانونية" },
        { icon: TrendingUp, title: "عوائد مجزية", desc: "هيكل عوائد مدروس يفوق البيع المباشر بعدة أضعاف" },
        { icon: Lock, title: "خصوصية تامة", desc: "بيانات المالك محمية حتى اكتمال الفحص النافي للجهالة" },
      ]
    : [
        { icon: MapPin, title: "Strategic Location", desc: "In-demand district with notable growth and genuine development appetite" },
        { icon: ShieldCheck, title: "Verified Documents", desc: "Authenticated deed, clear boundaries, no legal disputes" },
        { icon: TrendingUp, title: "Attractive Returns", desc: "Structured returns well above a direct sale" },
        { icon: Lock, title: "Total Privacy", desc: "Owner data protected until due diligence completes" },
      ];

  return (
    <div className="min-h-screen bg-[#FAFBFC]" dir={isAr ? "rtl" : "ltr"}>
      <Navbar />

      <InnerHero
        pageSlug="offers"
        title={isAr ? offer.title.ar : offer.title.en}
        subtitle={isAr ? `${offer.city.ar} • ${offer.district.ar}` : `${offer.city.en} • ${offer.district.en}`}
        isAr={isAr}
        image={headerPartnershipsImg}
        icon={isPartnership ? Handshake : Gem}
        eyebrow={isAr ? offerTypeLabels[offer.type].ar : offerTypeLabels[offer.type].en}
      />

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-3.5">
          <div className="flex items-center gap-1.5 md:gap-2 text-[12px] md:text-[13px] overflow-x-auto whitespace-nowrap">
            <Link to="/" className="text-gray-400 hover:text-[#2B4C66] transition-colors font-medium">{isAr ? "الرئيسية" : "Home"}</Link>
            <Chevron className="h-3 w-3 text-gray-300" strokeWidth={2} />
            <Link to="/offers" className="text-gray-400 hover:text-[#2B4C66] transition-colors font-medium">{isAr ? "العروض العقارية" : "Offers"}</Link>
            <Chevron className="h-3 w-3 text-gray-300" strokeWidth={2} />
            <span className="text-[#2B4C66] font-semibold truncate max-w-[180px]">{isAr ? offer.city.ar : offer.city.en}</span>
          </div>
        </div>
      </div>

      {/* ═══════ QUICK STATS BAR ═══════ */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-5 md:py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[
              { icon: Ruler, label: isAr ? "المساحة" : "Area", value: `${offer.area_sqm.toLocaleString("en-US")}`, unit: isAr ? "م²" : "sqm", sub: `${areaHa} ${isAr ? "هكتار" : "ha"}` },
              { icon: Building2, label: isAr ? "الاستخدام" : "Usage", value: isAr ? usageTypeLabels[offer.usageType]?.ar : usageTypeLabels[offer.usageType]?.en, unit: "", sub: isAr ? "معتمد نظامياً" : "Regulation compliant" },
              { icon: TrendingUp, label: isAr ? "عوائد متوقعة" : "Est. Returns", value: expectedReturn, unit: "", sub: isAr ? "على 3 سنوات" : "over 3 years" },
              { icon: Clock, label: isAr ? "المدة المتوقعة" : "Timeline", value: timeline, unit: "", sub: isAr ? "من التوقيع" : "from signing" },
            ].map((stat, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`shrink-0 w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center ${isPartnership ? "bg-[#2B4C66]/[0.08]" : "bg-emerald-50"}`}>
                  <stat.icon className={`h-5 w-5 ${accentText}`} strokeWidth={1.7} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] md:text-[11px] text-gray-400 uppercase tracking-wider font-bold mb-1">{stat.label}</p>
                  <p className="text-[14px] md:text-[16px] font-bold text-gray-900 truncate">
                    {stat.value} <span className="text-[11px] text-gray-400 font-semibold">{stat.unit}</span>
                  </p>
                  <p className="text-[10px] md:text-[11px] text-gray-400 mt-0.5">{stat.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main content */}
      <section className="py-8 md:py-10">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid gap-6 md:gap-8 lg:grid-cols-3">

            {/* ═══════ MAIN COLUMN ═══════ */}
            <div className="lg:col-span-2 space-y-6 md:space-y-7">

              {/* Main image */}
              <div className="relative rounded-2xl overflow-hidden h-[280px] sm:h-[360px] md:h-[440px] shadow-[0_8px_30px_-8px_rgba(0,0,0,0.12)]">
                <img src={offer.imageUrl} alt={isAr ? offer.title.ar : offer.title.en} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
                <div className="absolute bottom-4 md:bottom-6 start-4 md:start-6 end-4 md:end-6">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wide text-white ${accentBg}`}>
                      {isPartnership ? <Handshake className="w-3 h-3" strokeWidth={2} /> : <Gem className="w-3 h-3" strokeWidth={2} />}
                      {isAr ? offerTypeLabels[offer.type].ar : offerTypeLabels[offer.type].en}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold bg-white/20 backdrop-blur-md text-white">
                      <MapPin className="w-3 h-3" strokeWidth={2} />
                      {isAr ? offer.city.ar : offer.city.en}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold bg-white/20 backdrop-blur-md text-white">
                      <BadgeCheck className="w-3 h-3" strokeWidth={2} />
                      {isAr ? "موثّق" : "Verified"}
                    </span>
                  </div>
                  <h1 className="text-[20px] sm:text-[24px] md:text-[30px] font-bold text-white leading-tight drop-shadow-sm">
                    {isAr ? offer.title.ar : offer.title.en}
                  </h1>
                </div>
              </div>

              {/* ═══════ OVERVIEW ═══════ */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5 md:p-7 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)]">
                <div className="flex items-center gap-2.5 mb-4 md:mb-5">
                  <div className={`w-9 h-9 rounded-xl ${isPartnership ? "bg-[#2B4C66]/[0.08]" : "bg-emerald-50"} flex items-center justify-center`}>
                    <Eye className={`w-4.5 h-4.5 ${accentText}`} strokeWidth={1.7} />
                  </div>
                  <h2 className="text-[17px] md:text-[19px] font-bold text-gray-900">
                    {isAr ? "نظرة عامة" : "Overview"}
                  </h2>
                </div>
                <p className="text-[14px] md:text-[15px] text-gray-700 leading-[1.95] mb-4">
                  {isAr ? offer.description.ar : offer.description.en}
                </p>
                <div className="text-[14px] md:text-[15px] text-gray-600 leading-[1.95] whitespace-pre-line">
                  {isAr ? offer.detailedDescription.ar : offer.detailedDescription.en}
                </div>
              </div>

              {/* ═══════ WHY THIS OPPORTUNITY — Pillars ═══════ */}
              <div className="bg-gradient-to-br from-[#F7F9FB] via-white to-[#F7F9FB] rounded-2xl border border-gray-100 p-5 md:p-7">
                <div className="flex items-center gap-2.5 mb-5 md:mb-6">
                  <div className="w-9 h-9 rounded-xl bg-[#C2A86B]/15 flex items-center justify-center">
                    <Sparkles className="w-4.5 h-4.5 text-[#A88A4A]" strokeWidth={1.7} />
                  </div>
                  <h2 className="text-[17px] md:text-[19px] font-bold text-gray-900">
                    {isAr ? "لماذا هذه الفرصة" : "Why This Opportunity"}
                  </h2>
                </div>
                <div className="grid sm:grid-cols-2 gap-3 md:gap-4">
                  {pillars.map((p, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-xl bg-white border border-gray-100 p-4 hover:border-[#C2A86B]/30 hover:shadow-[0_8px_24px_-12px_rgba(194,168,107,0.25)] transition-all">
                      <div className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-[#C2A86B]/15 to-[#C2A86B]/5 flex items-center justify-center">
                        <p.icon className="w-5 h-5 text-[#A88A4A]" strokeWidth={1.7} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-[14px] font-bold text-[#1E374B] mb-1">{p.title}</h3>
                        <p className="text-[12.5px] text-gray-500 leading-[1.7]">{p.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ═══════ KEY FEATURES (from DB) ═══════ */}
              {offer.features.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-5 md:p-7">
                  <div className="flex items-center gap-2.5 mb-5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                      <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" strokeWidth={1.7} />
                    </div>
                    <h2 className="text-[17px] md:text-[19px] font-bold text-gray-900">
                      {isAr ? "المميزات الرئيسية" : "Key Features"}
                    </h2>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {offer.features.map((f, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-xl bg-emerald-50/40 border border-emerald-100/60 px-4 py-3.5 hover:bg-emerald-50 transition-colors">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" strokeWidth={2} />
                        </div>
                        <span className="text-[13.5px] md:text-[14px] text-gray-700 font-medium">{isAr ? f.ar : f.en}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ═══════ PROCESS JOURNEY ═══════ */}
              <div className="bg-[#0F1F2E] rounded-2xl p-5 md:p-7 overflow-hidden relative">
                <div className="absolute -top-10 -end-10 w-48 h-48 rounded-full bg-[#C2A86B]/15 blur-3xl pointer-events-none" />
                <div className="relative">
                  <div className="flex items-center gap-2.5 mb-5 md:mb-6">
                    <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                      <Gauge className="w-4.5 h-4.5 text-[#D7C084]" strokeWidth={1.7} />
                    </div>
                    <h2 className="text-[17px] md:text-[19px] font-bold text-white">
                      {isAr ? "كيف تسير الصفقة" : "How the Deal Works"}
                    </h2>
                  </div>
                  <div className="space-y-3">
                    {stages.map((stage, i) => (
                      <div key={i} className="flex items-start gap-3 md:gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-3 md:p-4 hover:bg-white/[0.06] transition-all group">
                        <div className="shrink-0 relative">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C2A86B]/25 to-[#C2A86B]/10 border border-[#C2A86B]/30 flex items-center justify-center">
                            <stage.icon className="w-4.5 h-4.5 text-[#D7C084]" strokeWidth={1.7} />
                          </div>
                          {i < stages.length - 1 && (
                            <div className="absolute top-10 start-1/2 -translate-x-1/2 w-px h-3 bg-[#C2A86B]/20" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-[13.5px] md:text-[14.5px] font-bold text-white mb-0.5">{stage.title}</h3>
                          <p className="text-[12px] md:text-[13px] text-white/55 leading-[1.7]">{stage.desc}</p>
                        </div>
                        <Chevron className="w-4 h-4 text-white/30 group-hover:text-[#D7C084] transition-colors" strokeWidth={2} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ═══════ TRUST & COMPLIANCE STRIP ═══════ */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5 md:p-7">
                <div className="flex items-center gap-2.5 mb-5">
                  <div className="w-9 h-9 rounded-xl bg-[#2B4C66]/[0.08] flex items-center justify-center">
                    <ShieldCheck className="w-4.5 h-4.5 text-[#2B4C66]" strokeWidth={1.7} />
                  </div>
                  <h2 className="text-[17px] md:text-[19px] font-bold text-gray-900">
                    {isAr ? "الحماية والمطابقة" : "Protection & Compliance"}
                  </h2>
                </div>
                <div className="grid sm:grid-cols-3 gap-3">
                  {[
                    { icon: BadgeCheck, label: isAr ? "مرخّصة من REGA" : "REGA Licensed" },
                    { icon: Lock, label: isAr ? "حماية بيانات كاملة" : "Full Data Protection" },
                    { icon: Scale, label: isAr ? "حوكمة نظامية" : "Regulatory Governance" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2.5 rounded-xl bg-gray-50 px-4 py-3">
                      <item.icon className="w-4 h-4 text-[#2B4C66] shrink-0" strokeWidth={1.8} />
                      <span className="text-[12.5px] font-semibold text-gray-700">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mobile CTA */}
              <div className="lg:hidden">
                <Link to="/auth/login" className="flex w-full items-center justify-center gap-3 h-[56px] bg-gradient-to-r from-[#2B4C66] to-[#1E374B] text-white text-[15px] font-bold rounded-2xl hover:shadow-[0_14px_40px_-12px_rgba(43,76,102,0.45)] transition-all shadow-[0_8px_24px_-8px_rgba(43,76,102,0.35)]">
                  <Building2 className="h-5 w-5" strokeWidth={1.5} />
                  {isAr ? "سجّل دخول كمطور للتقديم" : "Developer Login to Apply"}
                  <ArrowUpRight className="h-4 w-4 opacity-70" strokeWidth={2} />
                </Link>
              </div>
            </div>

            {/* ═══════ SIDEBAR ═══════ */}
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-24 space-y-5">

                {/* Summary card */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_8px_30px_-10px_rgba(15,31,46,0.12)] overflow-hidden">
                  <div className={`h-1 bg-gradient-to-r from-[#C2A86B] via-[#D7C084] to-[#C2A86B]`} />

                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[16px] font-bold text-gray-900">{isAr ? "ملخص العرض" : "Offer Summary"}</h3>
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-50">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">{isAr ? "نشط" : "Live"}</span>
                      </div>
                    </div>

                    {/* Price/Value headline */}
                    <div className={`rounded-xl ${isPartnership ? "bg-[#2B4C66]/[0.04] border-[#2B4C66]/15" : "bg-emerald-50 border-emerald-100"} border p-4`}>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-1">
                        {isAr ? "عائد متوقع" : "Expected Return"}
                      </p>
                      <p className={`text-[22px] font-bold ${accentText}`} dir="ltr">{expectedReturn}</p>
                      <p className="text-[11px] text-gray-500 mt-1">{isAr ? "حسب هيكل الشراكة النهائي" : "Per final partnership structure"}</p>
                    </div>

                    <div className="space-y-0.5">
                      {[
                        { icon: Target, label: isAr ? "نوع العرض" : "Type", value: isAr ? offerTypeLabels[offer.type].ar : offerTypeLabels[offer.type].en, color: accentText },
                        { icon: MapPin, label: isAr ? "المدينة" : "City", value: isAr ? offer.city.ar : offer.city.en },
                        { icon: MapPin, label: isAr ? "الحي" : "District", value: isAr ? offer.district.ar : offer.district.en },
                        { icon: Building2, label: isAr ? "الاستخدام" : "Usage", value: isAr ? usageTypeLabels[offer.usageType]?.ar : usageTypeLabels[offer.usageType]?.en },
                        { icon: Ruler, label: isAr ? "المساحة" : "Area", value: `${offer.area_sqm.toLocaleString("en-US")} ${isAr ? "م²" : "sqm"}` },
                        { icon: Calendar, label: isAr ? "المدة" : "Timeline", value: timeline },
                      ].map((row, i, arr) => (
                        <div key={i} className={`flex items-center justify-between py-2.5 ${i < arr.length - 1 ? "border-b border-gray-50" : ""}`}>
                          <div className="flex items-center gap-2">
                            <row.icon className="w-3.5 h-3.5 text-gray-300" strokeWidth={1.8} />
                            <span className="text-[11.5px] text-gray-400 uppercase tracking-wider font-semibold">{row.label}</span>
                          </div>
                          <span className={`text-[12.5px] font-bold text-end ${row.color || "text-gray-800"}`}>{row.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="px-6 pb-6">
                    <Link to="/auth/login" className="group flex w-full items-center justify-center gap-2.5 h-[52px] bg-gradient-to-r from-[#2B4C66] to-[#1E374B] text-white text-[14px] font-bold rounded-xl hover:shadow-[0_12px_30px_-8px_rgba(43,76,102,0.5)] hover:-translate-y-0.5 transition-all shadow-[0_6px_16px_-4px_rgba(43,76,102,0.35)]">
                      <Building2 className="h-4 w-4" strokeWidth={1.8} />
                      {isAr ? "دخول المطورين للتقديم" : "Developer Login to Apply"}
                      <ArrowUpRight className="h-3.5 w-3.5 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" strokeWidth={2} />
                    </Link>
                    <div className="mt-3 flex items-center justify-center gap-1.5 text-[10.5px] text-gray-400">
                      <ShieldCheck className="h-3 w-3 text-[#C2A86B]" strokeWidth={2} />
                      <span>{isAr ? "بياناتك مشفّرة — NDA رقمي قبل أي كشف" : "Encrypted • Digital NDA before any disclosure"}</span>
                    </div>
                  </div>
                </div>

                {/* Stats pills */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <h4 className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-4">
                    {isAr ? "إحصائيات المنصة" : "Platform Stats"}
                  </h4>
                  <div className="space-y-4">
                    {[
                      { icon: Handshake, label: isAr ? "شراكات مُبرمة" : "Deals closed", value: "42+" },
                      { icon: Users, label: isAr ? "مطورون معتمدون" : "Verified developers", value: "60+" },
                      { icon: BarChart3, label: isAr ? "متوسط معدل النجاح" : "Avg. success rate", value: "87%" },
                    ].map((s, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                            <s.icon className="w-4 h-4 text-[#2B4C66]" strokeWidth={1.8} />
                          </div>
                          <span className="text-[12.5px] text-gray-600 font-medium">{s.label}</span>
                        </div>
                        <span className="text-[14px] font-bold text-[#1E374B]" dir="ltr">{s.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Link to="/offers" className="flex items-center gap-2 text-[13px] text-gray-400 hover:text-[#2B4C66] transition-colors font-medium group">
                  <Arrow className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" strokeWidth={1.7} />
                  {isAr ? "العودة لجميع العروض" : "Back to all offers"}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ RELATED OFFERS ═══════ */}
      {related.length > 0 && (
        <section className="py-12 md:py-16 bg-white border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="flex items-end justify-between mb-8 md:mb-10">
              <div>
                <h2 className="text-[22px] md:text-[28px] font-bold text-[#1E374B] tracking-tight mb-2">
                  {isAr ? "فرص مشابهة" : "Similar Opportunities"}
                </h2>
                <p className="text-[13px] md:text-[14px] text-gray-500">
                  {isAr ? "عروض قد تهمّك من نفس النوع" : "Offers you may be interested in"}
                </p>
              </div>
              <Link to="/offers" className="hidden md:inline-flex items-center gap-1.5 text-[13px] font-semibold text-gray-600 hover:text-[#2B4C66] transition-colors">
                {isAr ? "عرض الكل" : "View All"}
                <Arrow className="h-3.5 w-3.5" strokeWidth={2} />
              </Link>
            </div>
            <div className="grid gap-4 md:gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <Link
                  key={r.id}
                  to={`/offers/${r.slug}`}
                  className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-[0_12px_32px_-10px_rgba(15,31,46,0.18)] hover:-translate-y-0.5 transition-all duration-300"
                >
                  <div className="relative h-[160px] md:h-[180px] overflow-hidden">
                    <img
                      src={r.imageUrl}
                      alt={isAr ? r.title.ar : r.title.en}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                    <span className={`absolute top-3 start-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold text-white backdrop-blur-md ${r.type === "partnership" ? "bg-[#2B4C66]/85" : "bg-emerald-600/85"}`}>
                      {r.type === "partnership" ? <Handshake className="w-3 h-3" strokeWidth={2} /> : <Gem className="w-3 h-3" strokeWidth={2} />}
                      {isAr ? offerTypeLabels[r.type].ar : offerTypeLabels[r.type].en}
                    </span>
                    <div className="absolute bottom-3 start-3 flex items-center gap-1.5 text-white">
                      <MapPin className="w-3.5 h-3.5" strokeWidth={2} />
                      <span className="text-[12.5px] font-bold">{isAr ? r.city.ar : r.city.en}</span>
                    </div>
                  </div>
                  <div className="p-4 md:p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        {isAr ? usageTypeLabels[r.usageType]?.ar : usageTypeLabels[r.usageType]?.en}
                      </span>
                      <span className="text-gray-300">•</span>
                      <span className="flex items-center gap-1 text-[10.5px] text-gray-400">
                        <Ruler className="h-3 w-3" strokeWidth={1.8} />
                        {r.area_sqm.toLocaleString("en-US")} {isAr ? "م²" : "sqm"}
                      </span>
                    </div>
                    <h3 className="text-[14px] font-bold text-gray-900 mb-2 leading-snug line-clamp-2 group-hover:text-[#2B4C66] transition-colors">
                      {isAr ? r.title.ar : r.title.en}
                    </h3>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-[12px] font-bold text-[#2B4C66]">
                        {isAr ? "عرض التفاصيل" : "View Details"}
                      </span>
                      <ArrowUpRight className="h-4 w-4 text-gray-300 group-hover:text-[#2B4C66] group-hover:rotate-12 transition-all" strokeWidth={2} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
};

export default OfferDetailPage;
