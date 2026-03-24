import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  MapPin, Ruler, Layers, ArrowRight, ArrowLeft, Building2,
  Target, TrendingUp, Shield, CheckCircle2, Calendar, Maximize2,
  MoveHorizontal, MoveVertical, Route, Handshake
} from "lucide-react";

import landPlaceholder1 from "@/assets/land-placeholder-1.jpg";
import landPlaceholder2 from "@/assets/land-placeholder-2.jpg";
import landPlaceholder3 from "@/assets/land-placeholder-3.jpg";

const usageLabels: Record<string, { ar: string; en: string }> = {
  residential: { ar: "سكني", en: "Residential" },
  commercial: { ar: "تجاري", en: "Commercial" },
  residential_commercial: { ar: "سكني تجاري", en: "Mixed Use" },
  high_density: { ar: "أبراج (سكني / تجاري / مكتبي)", en: "Towers (Residential / Commercial / Office)" },
};

const districtNameAr: Record<string, string> = {
  "Al Malqa": "الملقا", "Al Shati": "الشاطئ", "Al Faisaliyah": "الفيصلية",
  "Al Awali": "العوالي", "Al Uyun": "العيون", "Al Hada": "الهدا",
  "Al Corniche": "الكورنيش", "Al Muruj": "المروج", "Al Sadd": "السد",
  "Al Rawdah": "الروضة", "Al Olaya": "العليا", "Al Wurud": "الورود",
  "Al Nakheel": "النخيل", "Al Hamra": "الحمراء", "Al Sulaimaniyah": "السليمانية",
  "Al Rabwah": "الربوة", "Al Zahra": "الزهراء", "Al Aziziyah": "العزيزية",
  "Al Khalidiyah": "الخالدية", "Al Naseem": "النسيم",
};

const goalLabels: Record<string, { ar: string; en: string }> = {
  develop_sell: { ar: "تطوير وبيع", en: "Develop & Sell" },
  develop_rent: { ar: "تطوير وتأجير", en: "Develop & Rent" },
  develop_mixed: { ar: "مختلط", en: "Mixed Development" },
  develop_complex: { ar: "مجمع متكامل", en: "Integrated Complex" },
  sell_develop: { ar: "بيع وتطوير", en: "Sell & Develop" },
  partial_exit: { ar: "تخارج جزئي", en: "Partial Exit" },
  offplan_sell: { ar: "تطوير وبيع على الخارطة", en: "Off-Plan Sell" },
  real_estate_contribution: { ar: "مساهمة عقارية", en: "Real Estate Contribution" },
};

const cityNameAr: Record<string, string> = {
  Riyadh: "الرياض", Jeddah: "جدة", Makkah: "مكة المكرمة", Madinah: "المدينة المنورة",
  Dammam: "الدمام", Khobar: "الخبر", Dhahran: "الظهران", Taif: "الطائف", Tabuk: "تبوك",
  Buraidah: "بريدة", "Khamis Mushait": "خميس مشيط", Abha: "أبها", Hail: "حائل",
  Najran: "نجران", Jazan: "جازان", Yanbu: "ينبع", Jubail: "الجبيل", "Al Ahsa": "الأحساء",
};

const placeholders = [landPlaceholder1, landPlaceholder2, landPlaceholder3];

const OpportunityDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  usePageTitle(isAr ? "تفاصيل الفرصة" : "Opportunity Details");

  const [land, setLand] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    supabase
      .from("lands_public" as any)
      .select("*")
      .eq("id", id)
      .eq("is_active", true)
      .eq("is_featured", true)
      .single()
      .then(({ data }) => {
        setLand(data);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-40">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">{isAr ? "جاري التحميل..." : "Loading..."}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!land) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-40 gap-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-border bg-card shadow-sm">
            <MapPin className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground font-light">{isAr ? "لم يتم العثور على هذه الفرصة" : "Opportunity not found"}</p>
          <Button onClick={() => navigate("/")} className="shadow-sm">{isAr ? "العودة للرئيسية" : "Back to Home"}</Button>
        </div>
        <Footer />
      </div>
    );
  }

  const imgSrc = land.image_url || placeholders[0];
  const cityAr = cityNameAr[land.city] || land.city;

  const features = [
    { icon: Shield, title: isAr ? "خصوصية تامة" : "Full Privacy", desc: isAr ? "بيانات الصك والموقع الدقيق محمية ولا تظهر إلا بعد موافقة المالك" : "Deed details and exact location are protected and only revealed after owner approval" },
    { icon: Target, title: isAr ? "فرصة مدروسة" : "Vetted Opportunity", desc: isAr ? "تم التحقق من ملكية الأرض ومطابقتها للأنظمة البلدية" : "Land ownership has been verified and complies with municipal regulations" },
    { icon: TrendingUp, title: isAr ? "عائد استثماري مميز" : "Attractive ROI", desc: isAr ? "موقع استراتيجي يضمن عوائد استثمارية مجزية للمطور" : "Strategic location ensuring attractive investment returns for the developer" },
    { icon: Building2, title: isAr ? "دعم متكامل" : "Full Support", desc: isAr ? "فريق سينا يرافقك في كل مرحلة من التفاوض حتى إتمام الصفقة" : "SYNA team accompanies you from negotiation to deal closure" },
  ];

  const summaryItems = [
    { label: isAr ? "نوع الأصل" : "Asset Type", value: isAr ? "أرض" : "Land" },
    { label: isAr ? "المساحة" : "Area", value: `${land.land_area_sqm?.toLocaleString()} ${isAr ? "م²" : "sqm"}` },
    { label: isAr ? "المدينة" : "City", value: isAr ? cityAr : land.city },
    ...(land.district ? [{ label: isAr ? "الحي" : "District", value: isAr ? (districtNameAr[land.district] || land.district) : land.district }] : []),
    { label: isAr ? "الاستخدام" : "Usage", value: isAr ? usageLabels[land.usage_type]?.ar : usageLabels[land.usage_type]?.en },
    { label: isAr ? "هدف الشراكة" : "Goal", value: isAr ? goalLabels[land.partnership_goal]?.ar : goalLabels[land.partnership_goal]?.en },
    ...(land.project_type ? [{ label: isAr ? "نوع المشروع" : "Project Type", value: land.project_type }] : []),
  ];

  return (
    <div className="min-h-screen bg-primary text-white relative overflow-hidden">
      <div className="luxury-grid absolute inset-0 opacity-20 pointer-events-none" />
      <Navbar />
      <main className="relative z-10">
        {/* ── Cinematic Hero ── */}
        <div className="relative h-[65vh] min-h-[500px] overflow-hidden">
          <motion.img
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 10, ease: "easeOut" }}
            src={imgSrc}
            alt={cityAr}
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          {/* Multi-layer overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-transparent" />

          {/* Bottom accent */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-white/10" />

          <div className="absolute bottom-0 inset-x-0 container pb-20">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2 }}>
              <Button
                variant="ghost"
                className="text-white/40 hover:text-white hover:bg-white/5 mb-8 gap-3 -ms-4 text-[10px] font-bold uppercase tracking-[0.2em] rounded-none"
                onClick={() => navigate("/")}
              >
                {isAr ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
                {isAr ? "العودة للقائمة السيادية" : "Back to Assets"}
              </Button>

              <div className="flex items-center gap-3 mb-6">
                <span className="bg-accent/10 border border-accent/30 px-5 py-2 text-[9px] font-bold text-accent uppercase tracking-[0.3em] rounded-none">
                  {land.partnership_goal === "real_estate_contribution"
                    ? (isAr ? "مساهمة عقارية" : "RE Contribution")
                    : (isAr ? "فرصة تطويرية" : "Development")}
                </span>
                <span className="border border-white/10 bg-white/5 px-4 py-2 text-[9px] font-bold text-white/80 uppercase tracking-[0.3em] rounded-none">
                  {isAr ? usageLabels[land.usage_type]?.ar : usageLabels[land.usage_type]?.en}
                </span>
              </div>

              <h1 className="text-4xl md:text-7xl font-medium text-white tracking-tight uppercase leading-none mb-6">
                {isAr
                  ? `أرض ${land.district ? `حي ${districtNameAr[land.district] || land.district}` : ""} في ${cityAr}`
                  : `${land.district || "Elite"} Asset — ${land.city}`
                }
              </h1>

              <div className="flex flex-wrap items-center gap-6 text-[11px] font-bold uppercase tracking-[0.2em] text-white/40">
                <span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-accent" strokeWidth={1.5} />{isAr ? cityAr : land.city}</span>
                <span className="h-4 w-px bg-white/10" />
                <span className="flex items-center gap-2"><Maximize2 className="h-4 w-4 text-accent" strokeWidth={1.5} />{land.land_area_sqm?.toLocaleString()} {isAr ? "م²" : "SQM"}</span>
                {land.partnership_goal && (
                  <>
                    <span className="h-4 w-px bg-white/10 hidden sm:block" />
                    <span className="hidden sm:flex items-center gap-2"><Handshake className="h-4 w-4 text-accent" strokeWidth={1.5} />{isAr ? goalLabels[land.partnership_goal]?.ar : goalLabels[land.partnership_goal]?.en}</span>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="container py-24 md:py-32">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Main */}
            <div className="lg:col-span-2 space-y-12">
              {/* Stats */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/5 border border-white/5">
                {[
                  { icon: Maximize2, val: land.land_area_sqm?.toLocaleString(), unit: isAr ? "م²" : "SQM", label: isAr ? "المساحة" : "Area" },
                  { icon: Layers, val: isAr ? usageLabels[land.usage_type]?.ar : usageLabels[land.usage_type]?.en, unit: "", label: isAr ? "الاستخدام" : "Usage" },
                  { icon: MapPin, val: isAr ? cityAr : land.city, unit: "", label: isAr ? "المدينة" : "City" },
                  { icon: Calendar, val: land.expected_dev_duration_months || "—", unit: land.expected_dev_duration_months ? (isAr ? "شهر" : "mo") : "", label: isAr ? "المدة" : "Duration" },
                ].map((s, i) => (
                  <div key={i} className="bg-primary p-8 text-center transition-all hover:bg-white/[0.03]">
                    <s.icon className="mx-auto h-6 w-6 text-accent mb-4" strokeWidth={1} />
                    <p className="text-xl font-medium text-white leading-tight uppercase tabular-nums">{s.val} <span className="text-[10px] text-white/30">{s.unit}</span></p>
                    <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em] mt-2">{s.label}</p>
                  </div>
                ))}
              </motion.div>

              {/* Description */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                className="bg-primary p-12 border border-white/5">
                <div className="mb-10">
                    <span className="text-[10px] font-bold text-accent uppercase tracking-[0.4em] block mb-4">MEMORANDUM</span>
                    <h2 className="text-2xl font-medium text-white uppercase tracking-tight">
                    {isAr ? "مواصفات الفرصة الاستثمارية" : "Investment Specification"}
                    </h2>
                </div>
                <div className="space-y-6 text-base font-light text-white/40 leading-[1.8]">
                  <p>
                    {isAr
                      ? `تتوفر أرض ${usageLabels[land.usage_type]?.ar || ""} بمساحة ${land.land_area_sqm?.toLocaleString()} متر مربع في ${land.district ? `حي ${districtNameAr[land.district] || land.district} ب` : ""}${cityAr}، وهي فرصة استثمارية مميزة لتطوير ${land.project_type || "مشروع عقاري"} يلبي الطلب المتنامي على العقارات في المنطقة.`
                      : `A ${usageLabels[land.usage_type]?.en || ""} land spanning ${land.land_area_sqm?.toLocaleString()} sqm is available in ${land.district ? `${land.district}, ` : ""}${land.city}. This is a premium investment opportunity to develop ${land.project_type || "a real estate project"} that meets the growing demand in the area.`
                    }
                  </p>
                  {land.vision_summary && <p>{land.vision_summary}</p>}
                  <p>
                    {land.partnership_goal === "real_estate_contribution"
                      ? (isAr
                        ? "يهدف المالك إلى المساهمة بأرضه ضمن نموذج مساهمة عقارية مرخصة مع مطور معتمد، حيث يتم التطوير والبيع مع حصول المالك على نسبة تخارج متفق عليها مسبقاً."
                        : "The owner seeks to contribute their land through a licensed real estate contribution model with a certified developer, where the land is developed and sold with the owner receiving a pre-agreed exit percentage.")
                      : (isAr
                        ? "يهدف المالك إلى شراكة تطويرية مع مطور عقاري معتمد لتحقيق أقصى قيمة من الأرض، مع توفير كامل الدعم والمرونة في آلية الشراكة."
                        : "The owner seeks a development partnership with a certified developer to maximize the land's value, offering full support and flexibility in the partnership structure.")
                    }
                  </p>
                </div>

                {/* Dimensions */}
                {(land.length_m || land.width_m || land.street_width_m) && (
                  <div className="mt-12 pt-12 border-t border-white/5">
                    <h3 className="text-[10px] font-bold text-white uppercase tracking-[0.3em] mb-8">{isAr ? "المعايير الهندسية" : "Engineering Parameters"}</h3>
                    <div className="grid grid-cols-3 gap-6">
                      {land.length_m && (
                        <div className="flex flex-col gap-2 p-6 bg-white/[0.02] border border-white/5">
                          <MoveVertical className="h-5 w-5 text-accent opacity-40 mb-2" strokeWidth={1} />
                          <p className="text-lg font-medium text-white tabular-nums">{land.length_m} <span className="text-[10px] opacity-30">M</span></p>
                          <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest">{isAr ? "الطول" : "Length"}</p>
                        </div>
                      )}
                      {land.width_m && (
                        <div className="flex flex-col gap-2 p-6 bg-white/[0.02] border border-white/5">
                          <MoveHorizontal className="h-5 w-5 text-accent opacity-40 mb-2" strokeWidth={1} />
                          <p className="text-lg font-medium text-white tabular-nums">{land.width_m} <span className="text-[10px] opacity-30">M</span></p>
                          <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest">{isAr ? "العرض" : "Width"}</p>
                        </div>
                      )}
                      {land.street_width_m && (
                        <div className="flex flex-col gap-2 p-6 bg-white/[0.02] border border-white/5">
                          <Route className="h-5 w-5 text-accent opacity-40 mb-2" strokeWidth={1} />
                          <p className="text-lg font-medium text-white tabular-nums">{land.street_width_m} <span className="text-[10px] opacity-30">M</span></p>
                          <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest">{isAr ? "عرض الشارع" : "Street"}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Why This Opportunity */}
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                className="bg-primary p-12 border border-white/5">
                <div className="mb-10">
                    <span className="text-[10px] font-bold text-accent uppercase tracking-[0.4em] block mb-4">MANDATE</span>
                    <h2 className="text-2xl font-medium text-white uppercase tracking-tight">
                    {isAr ? "مزايا التحالف الاستثماري" : "Strategic Advantages"}
                    </h2>
                </div>
                <div className="grid sm:grid-cols-2 gap-px bg-white/5 border border-white/5">
                  {features.map((f, idx) => (
                    <motion.div key={idx} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.08 }}
                      className="flex gap-6 p-8 bg-primary transition-all duration-500 hover:bg-white/[0.03]">
                      <div className="shrink-0 flex h-12 w-12 items-center justify-center border border-white/10 bg-white/5 text-accent rounded-none">
                        <f.icon className="h-6 w-6" strokeWidth={1} />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-white uppercase tracking-[0.2em] mb-2">{f.title}</p>
                        <p className="text-[13px] font-light text-white/40 leading-relaxed">{f.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* ── Sidebar ── */}
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              className="space-y-6">
              <div className="bg-primary p-10 border border-white/10 sticky top-32">
                <div className="mb-8">
                    <span className="text-[9px] font-bold text-accent uppercase tracking-[0.4em] block mb-2">SUMMARY</span>
                    <h3 className="text-base font-medium text-white uppercase tracking-widest">{isAr ? "ملخص الفرصة الاستثمارية" : "Executive Summary"}</h3>
                </div>

                <div className="space-y-0 border-y border-white/5">
                  {summaryItems.map((item, i) => (
                    <div key={i} className="flex justify-between py-5 border-b last:border-0 border-white/5">
                      <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{item.label}</span>
                      <span className="text-[11px] font-medium text-white uppercase tracking-tight">{item.value}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-10 space-y-4">
                  <Button
                    className="w-full gap-3 rounded-none h-16 text-[11px] font-bold uppercase tracking-[0.3em] bg-accent text-primary hover:bg-white hover:text-black transition-all duration-500"
                    onClick={() => navigate("/auth/register")}
                  >
                    <Handshake className="h-5 w-5" />
                    {isAr ? "سجل كمطور للاستحواذ" : "Register as Developer"}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full rounded-none h-16 text-[11px] font-bold uppercase tracking-[0.3em] border-white/10 bg-transparent text-white hover:bg-white hover:text-black transition-all duration-500"
                    onClick={() => navigate("/auth/login")}
                  >
                    {isAr ? "تسجيل الدخول" : "Portal Login"}
                  </Button>
                </div>

                <div className="mt-8 flex items-start gap-4 p-6 bg-white/[0.02] border-s-2 border-accent">
                  <Shield className="h-5 w-5 text-accent mt-0.5 shrink-0 opacity-50" strokeWidth={1.5} />
                  <p className="text-[11px] font-light text-white/40 leading-[1.8]">
                    {isAr
                      ? "للاطلاع على تفاصيل الموقع الدقيق وبيانات الصك، يرجى التسجيل كمطور معتمد. سيتم مراجعة طلبك من قبل لجنة الحوكمة."
                      : "To access exact coordinates and sovereign deed information, please register as a certified developer. Your application will be reviewed by the governance committee."
                    }
                  </p>
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

export default OpportunityDetail;
