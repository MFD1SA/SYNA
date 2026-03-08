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
      <div className="min-h-screen bg-[hsl(210,30%,4%)]">
        <Navbar />
        <div className="flex items-center justify-center py-40">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[hsl(200,80%,55%)] border-t-transparent" />
            <p className="text-sm text-[hsl(210,15%,50%)]">{isAr ? "جاري التحميل..." : "Loading..."}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!land) {
    return (
      <div className="min-h-screen bg-[hsl(210,30%,4%)]">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-40 gap-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-[hsl(210,22%,12%)] bg-[hsl(210,28%,7%)]">
            <MapPin className="h-8 w-8 text-[hsl(210,15%,40%)]" />
          </div>
          <p className="text-[hsl(210,15%,50%)]">{isAr ? "لم يتم العثور على هذه الفرصة" : "Opportunity not found"}</p>
          <Button onClick={() => navigate("/")} className="syna-gradient">{isAr ? "العودة للرئيسية" : "Back to Home"}</Button>
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
    <div className="min-h-screen bg-[hsl(210,30%,4%)]">
      <Navbar />
      <main>
        {/* ── Cinematic Hero ── */}
        <div className="relative h-[55vh] min-h-[420px] md:h-[65vh] md:min-h-[520px] overflow-hidden">
          <motion.img
            initial={{ scale: 1.1 }}
            animate={{ scale: 1.02 }}
            transition={{ duration: 8, ease: "easeOut" }}
            src={imgSrc}
            alt={cityAr}
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          {/* Multi-layer overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[hsl(210,30%,4%)] via-[hsl(210,30%,4%,0.5)] to-[hsl(210,30%,4%,0.15)]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[hsl(210,30%,4%,0.6)] to-transparent" />

          {/* Bottom accent */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[hsl(200,80%,45%,0.4)] to-transparent" />

          <div className="absolute bottom-0 inset-x-0 container pb-8 md:pb-12">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}>
              <Button
                variant="ghost"
                className="text-white/50 hover:text-white hover:bg-white/10 mb-5 gap-2 -ms-3 text-xs rounded-xl"
                onClick={() => navigate("/")}
              >
                {isAr ? <ArrowRight className="h-3.5 w-3.5" /> : <ArrowLeft className="h-3.5 w-3.5" />}
                {isAr ? "العودة للفرص" : "Back to Opportunities"}
              </Button>

              <div className="flex items-center gap-2.5 mb-4">
                <span className="rounded-full syna-gradient px-4 py-1.5 text-[11px] font-medium text-white shadow-[0_4px_20px_-4px_hsl(200,80%,50%,0.4)]">
                  {land.partnership_goal === "real_estate_contribution"
                    ? (isAr ? "مساهمة عقارية" : "Real Estate Contribution")
                    : (isAr ? "فرصة تطويرية" : "Development Opportunity")}
                </span>
                <span className="rounded-full border border-white/15 bg-white/8 px-3 py-1 text-[11px] font-medium text-white/90 backdrop-blur-lg">
                  {isAr ? usageLabels[land.usage_type]?.ar : usageLabels[land.usage_type]?.en}
                </span>
              </div>

              <h1 className="text-3xl md:text-5xl font-medium text-white leading-tight mb-3">
                {isAr
                  ? `أرض ${land.district ? `حي ${districtNameAr[land.district] || land.district} — ` : ""}${cityAr}`
                  : `Land${land.district ? ` in ${land.district},` : ""} ${land.city}`
                }
              </h1>

              <div className="flex items-center gap-4 text-sm text-white/50">
                <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{isAr ? cityAr : land.city}</span>
                <span className="h-3 w-px bg-white/15" />
                <span className="flex items-center gap-1.5"><Maximize2 className="h-3.5 w-3.5" />{land.land_area_sqm?.toLocaleString()} {isAr ? "م²" : "sqm"}</span>
                {land.partnership_goal && (
                  <>
                    <span className="h-3 w-px bg-white/15 hidden sm:block" />
                    <span className="hidden sm:flex items-center gap-1.5"><Handshake className="h-3.5 w-3.5" />{isAr ? goalLabels[land.partnership_goal]?.ar : goalLabels[land.partnership_goal]?.en}</span>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="container py-8 md:py-12">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main */}
            <div className="lg:col-span-2 space-y-6">
              {/* Stats */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { icon: Maximize2, val: land.land_area_sqm?.toLocaleString(), unit: isAr ? "م²" : "sqm", label: isAr ? "المساحة" : "Area" },
                  { icon: Layers, val: isAr ? usageLabels[land.usage_type]?.ar : usageLabels[land.usage_type]?.en, unit: "", label: isAr ? "الاستخدام" : "Usage" },
                  { icon: MapPin, val: isAr ? cityAr : land.city, unit: "", label: isAr ? "المدينة" : "City" },
                  { icon: Calendar, val: land.expected_dev_duration_months || "—", unit: land.expected_dev_duration_months ? (isAr ? "شهر" : "mo") : "", label: isAr ? "المدة المتوقعة" : "Duration" },
                ].map((s, i) => (
                  <div key={i} className="rounded-2xl border border-[hsl(210,22%,12%)] bg-[hsl(210,28%,7%)] p-4 text-center transition-all duration-300 hover:border-[hsl(200,80%,45%,0.2)]">
                    <s.icon className="mx-auto h-4.5 w-4.5 text-[hsl(200,80%,55%)] mb-2" strokeWidth={1.5} />
                    <p className="text-lg font-medium text-white leading-tight">{s.val} <span className="text-xs text-[hsl(210,15%,45%)]">{s.unit}</span></p>
                    <p className="text-[11px] text-[hsl(210,15%,45%)] mt-1">{s.label}</p>
                  </div>
                ))}
              </motion.div>

              {/* Description */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                className="rounded-2xl border border-[hsl(210,22%,12%)] bg-[hsl(210,28%,7%)] p-6">
                <h2 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full syna-gradient" />
                  {isAr ? "تفاصيل الفرصة" : "Opportunity Details"}
                </h2>
                <div className="space-y-4 text-sm text-[hsl(210,15%,55%)] leading-relaxed">
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
                  <div className="mt-6 pt-5 border-t border-[hsl(210,22%,12%)]">
                    <h3 className="text-sm font-medium text-white mb-3">{isAr ? "الأبعاد" : "Dimensions"}</h3>
                    <div className="grid grid-cols-3 gap-3">
                      {land.length_m && (
                        <div className="flex items-center gap-2.5 rounded-xl bg-[hsl(210,25%,10%)] border border-[hsl(210,22%,14%)] p-3">
                          <MoveVertical className="h-4 w-4 text-[hsl(200,80%,55%)] shrink-0" strokeWidth={1.5} />
                          <div>
                            <p className="text-sm font-medium text-white">{land.length_m} {isAr ? "م" : "m"}</p>
                            <p className="text-[10px] text-[hsl(210,15%,45%)]">{isAr ? "الطول" : "Length"}</p>
                          </div>
                        </div>
                      )}
                      {land.width_m && (
                        <div className="flex items-center gap-2.5 rounded-xl bg-[hsl(210,25%,10%)] border border-[hsl(210,22%,14%)] p-3">
                          <MoveHorizontal className="h-4 w-4 text-[hsl(200,80%,55%)] shrink-0" strokeWidth={1.5} />
                          <div>
                            <p className="text-sm font-medium text-white">{land.width_m} {isAr ? "م" : "m"}</p>
                            <p className="text-[10px] text-[hsl(210,15%,45%)]">{isAr ? "العرض" : "Width"}</p>
                          </div>
                        </div>
                      )}
                      {land.street_width_m && (
                        <div className="flex items-center gap-2.5 rounded-xl bg-[hsl(210,25%,10%)] border border-[hsl(210,22%,14%)] p-3">
                          <Route className="h-4 w-4 text-[hsl(200,80%,55%)] shrink-0" strokeWidth={1.5} />
                          <div>
                            <p className="text-sm font-medium text-white">{land.street_width_m} {isAr ? "م" : "m"}</p>
                            <p className="text-[10px] text-[hsl(210,15%,45%)]">{isAr ? "عرض الشارع" : "Street"}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Why This Opportunity */}
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                className="rounded-2xl border border-[hsl(210,22%,12%)] bg-[hsl(210,28%,7%)] p-6">
                <h2 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full syna-gradient" />
                  {isAr ? "لماذا هذه الفرصة؟" : "Why This Opportunity?"}
                </h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {features.map((f, idx) => (
                    <motion.div key={idx} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.08 }}
                      className="flex gap-3 p-4 rounded-xl bg-[hsl(210,25%,10%)] border border-[hsl(210,22%,14%)] transition-all duration-300 hover:border-[hsl(200,80%,45%,0.2)]">
                      <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(200,80%,45%,0.08)] border border-[hsl(200,80%,45%,0.1)]">
                        <f.icon className="h-5 w-5 text-[hsl(200,80%,55%)]" strokeWidth={1.5} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{f.title}</p>
                        <p className="text-xs text-[hsl(210,15%,50%)] mt-1 leading-relaxed">{f.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* ── Sidebar ── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              className="space-y-4">
              <div className="rounded-2xl border border-[hsl(210,22%,12%)] bg-[hsl(210,28%,7%)] p-6 sticky top-24">
                <h3 className="text-base font-medium text-white mb-5 flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full syna-gradient" />
                  {isAr ? "ملخص الفرصة" : "Opportunity Summary"}
                </h3>

                <div className="space-y-0">
                  {summaryItems.map((item, i) => (
                    <div key={i} className="flex justify-between py-3 border-b border-[hsl(210,22%,12%)] last:border-0">
                      <span className="text-xs text-[hsl(210,15%,45%)]">{item.label}</span>
                      <span className="text-xs font-medium text-white">{item.value}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 space-y-3">
                  <Button
                    className="w-full gap-2 syna-gradient border-0 text-white rounded-xl h-11 text-sm transition-all duration-300 hover:shadow-[0_8px_30px_-8px_hsl(200,80%,50%,0.35)]"
                    onClick={() => navigate("/auth/register")}
                  >
                    <Handshake className="h-4 w-4" />
                    {isAr ? "سجل كمطور للتقديم" : "Register as Developer"}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-[hsl(210,22%,16%)] bg-transparent text-[hsl(210,15%,70%)] hover:bg-[hsl(210,22%,12%)] hover:text-white rounded-xl h-11 text-sm"
                    onClick={() => navigate("/auth/login")}
                  >
                    {isAr ? "تسجيل الدخول" : "Login"}
                  </Button>
                </div>

                <div className="mt-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-[hsl(200,80%,45%,0.05)] border border-[hsl(200,80%,45%,0.1)]">
                  <CheckCircle2 className="h-4 w-4 text-[hsl(200,80%,55%)] mt-0.5 shrink-0" strokeWidth={1.5} />
                  <p className="text-[11px] text-[hsl(210,15%,50%)] leading-relaxed">
                    {isAr
                      ? "للاطلاع على تفاصيل الموقع الدقيق وبيانات الصك، يرجى التسجيل كمطور معتمد. سيتم مراجعة طلبك خلال 24 ساعة."
                      : "To access exact location details and deed information, please register as a certified developer. Your application will be reviewed within 24 hours."
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
