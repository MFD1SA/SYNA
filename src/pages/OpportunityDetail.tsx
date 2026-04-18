import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import PageShell from "@/components/landing/PageShell";
import {
  MapPin, Ruler, Layers, ArrowRight, ArrowLeft, Building2,
  Target, TrendingUp, Shield, Calendar, Maximize2,
  MoveHorizontal, MoveVertical, Route, Handshake, Loader2
} from "lucide-react";

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
      })
      .catch(console.error);
  }, [id]);

  if (loading) {
    return (
      <PageShell>
        <div className="flex items-center justify-center py-40">
          <Loader2 className="w-6 h-6 animate-spin text-sina-blue" />
        </div>
      </PageShell>
    );
  }

  if (!land) {
    return (
      <PageShell>
        <div className="flex flex-col items-center justify-center py-40 gap-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#F7F9FB] border border-gray-100">
            <MapPin className="h-7 w-7 text-gray-300" />
          </div>
          <p className="text-gray-500 text-[14px]">{isAr ? "لم يتم العثور على هذه الفرصة" : "Opportunity not found"}</p>
          <button
            onClick={() => navigate("/opportunities")}
            className="px-6 py-3 bg-sina-blue text-white text-[13px] font-semibold rounded-lg hover:bg-sina-dark-blue transition-colors"
          >
            {isAr ? "العودة للفرص" : "Back to Opportunities"}
          </button>
        </div>
      </PageShell>
    );
  }

  const cityAr = cityNameAr[land.city] || land.city;
  const districtAr = districtNameAr[land.district] || land.district;

  const features = [
    { icon: Shield, title: isAr ? "خصوصية تامة" : "Full Privacy", desc: isAr ? "بيانات الصك والموقع الدقيق محمية ولا تظهر إلا بعد موافقة المالك" : "Deed details and exact location are protected and only revealed after owner approval" },
    { icon: Target, title: isAr ? "فرصة مدروسة" : "Vetted Opportunity", desc: isAr ? "تم التحقق من ملكية الأرض ومطابقتها للأنظمة البلدية" : "Land ownership has been verified and complies with municipal regulations" },
    { icon: TrendingUp, title: isAr ? "عائد استثماري مميز" : "Attractive ROI", desc: isAr ? "موقع استراتيجي يضمن عوائد استثمارية مجزية للمطور" : "Strategic location ensuring attractive investment returns for the developer" },
    { icon: Building2, title: isAr ? "دعم متكامل" : "Full Support", desc: isAr ? "فريق سينا يرافقك في كل مرحلة من التفاوض حتى إتمام الصفقة" : "SINA team accompanies you from negotiation to deal closure" },
  ];

  const summaryItems = [
    { label: isAr ? "نوع الأصل" : "Asset Type", value: isAr ? "أرض" : "Land" },
    { label: isAr ? "المساحة" : "Area", value: `${land.land_area_sqm?.toLocaleString()} ${isAr ? "م²" : "sqm"}` },
    { label: isAr ? "المدينة" : "City", value: isAr ? cityAr : land.city },
    ...(land.district ? [{ label: isAr ? "الحي" : "District", value: isAr ? districtAr : land.district }] : []),
    { label: isAr ? "الاستخدام" : "Usage", value: isAr ? usageLabels[land.usage_type]?.ar : usageLabels[land.usage_type]?.en },
    { label: isAr ? "هدف الشراكة" : "Goal", value: isAr ? goalLabels[land.partnership_goal]?.ar : goalLabels[land.partnership_goal]?.en },
    ...(land.project_type ? [{ label: isAr ? "نوع المشروع" : "Project Type", value: land.project_type }] : []),
    ...(land.expected_dev_duration_months ? [{ label: isAr ? "المدة المتوقعة" : "Duration", value: `${land.expected_dev_duration_months} ${isAr ? "شهر" : "months"}` }] : []),
  ];

  return (
    <PageShell>
      {/* Hero Banner */}
      <section className="bg-sina-charcoal text-white py-16 lg:py-20" dir={isAr ? "rtl" : "ltr"}>
        <div className="container max-w-6xl">
          <button
            onClick={() => navigate("/opportunities")}
            className="flex items-center gap-2 text-[13px] text-white/50 hover:text-white transition-colors mb-8"
          >
            {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            {isAr ? "العودة للفرص المتاحة" : "Back to Opportunities"}
          </button>

          <div className="flex flex-wrap items-center gap-3 mb-5">
            <span className="px-3 py-1 bg-sina-blue/20 text-sina-blue text-[11px] font-medium rounded border border-sina-blue/30">
              {land.partnership_goal === "real_estate_contribution"
                ? (isAr ? "مساهمة عقارية" : "RE Contribution")
                : (isAr ? "فرصة تطويرية" : "Development")}
            </span>
            {land.usage_type && (
              <span className="px-3 py-1 bg-white/5 text-white/70 text-[11px] font-medium rounded border border-white/10">
                {isAr ? usageLabels[land.usage_type]?.ar : usageLabels[land.usage_type]?.en}
              </span>
            )}
          </div>

          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            {isAr
              ? `أرض ${land.district ? `حي ${districtAr}` : ""} في ${cityAr}`
              : `${land.district || ""} Land — ${land.city}`
            }
          </h1>

          <div className="flex flex-wrap items-center gap-5 text-[13px] text-white/50">
            <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{isAr ? cityAr : land.city}</span>
            <span className="flex items-center gap-1.5"><Maximize2 className="w-4 h-4" />{land.land_area_sqm?.toLocaleString()} {isAr ? "م²" : "sqm"}</span>
            {land.partnership_goal && (
              <span className="flex items-center gap-1.5"><Handshake className="w-4 h-4" />{isAr ? goalLabels[land.partnership_goal]?.ar : goalLabels[land.partnership_goal]?.en}</span>
            )}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 lg:py-24 bg-white" dir={isAr ? "rtl" : "ltr"}>
        <div className="container max-w-6xl">
          <div className="grid lg:grid-cols-3 gap-10">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-10">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { icon: Maximize2, val: land.land_area_sqm?.toLocaleString(), unit: isAr ? "م²" : "sqm", label: isAr ? "المساحة" : "Area" },
                  { icon: Layers, val: isAr ? usageLabels[land.usage_type]?.ar : usageLabels[land.usage_type]?.en, unit: "", label: isAr ? "الاستخدام" : "Usage" },
                  { icon: MapPin, val: isAr ? cityAr : land.city, unit: "", label: isAr ? "المدينة" : "City" },
                  { icon: Calendar, val: land.expected_dev_duration_months || "—", unit: land.expected_dev_duration_months ? (isAr ? "شهر" : "mo") : "", label: isAr ? "المدة" : "Duration" },
                ].map((s, i) => (
                  <div key={i} className="bg-[#F7F9FB] rounded-xl p-5 text-center border border-gray-100">
                    <s.icon className="mx-auto h-5 w-5 text-sina-blue mb-3" strokeWidth={1.5} />
                    <p className="text-[15px] font-semibold text-sina-charcoal">{s.val} <span className="text-[11px] text-gray-400">{s.unit}</span></p>
                    <p className="text-[11px] text-gray-400 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Description */}
              <div className="bg-[#F7F9FB] rounded-xl p-8 border border-gray-100">
                <h2 className="text-lg font-bold text-sina-charcoal mb-5">
                  {isAr ? "مواصفات الفرصة" : "Opportunity Details"}
                </h2>
                <div className="space-y-4 text-[14px] text-gray-600 leading-[1.9]">
                  <p>
                    {isAr
                      ? `تتوفر أرض ${usageLabels[land.usage_type]?.ar || ""} بمساحة ${land.land_area_sqm?.toLocaleString()} متر مربع في ${land.district ? `حي ${districtAr} ب` : ""}${cityAr}، وهي فرصة استثمارية مميزة لتطوير ${land.project_type || "مشروع عقاري"} يلبي الطلب المتنامي على العقارات في المنطقة.`
                      : `A ${usageLabels[land.usage_type]?.en || ""} land spanning ${land.land_area_sqm?.toLocaleString()} sqm is available in ${land.district ? `${land.district}, ` : ""}${land.city}. This is a premium investment opportunity to develop ${land.project_type || "a real estate project"} that meets the growing demand in the area.`
                    }
                  </p>
                  {land.vision_summary && <p>{land.vision_summary}</p>}
                  <p>
                    {land.partnership_goal === "real_estate_contribution"
                      ? (isAr
                        ? "يهدف المالك إلى المساهمة بأرضه ضمن نموذج مساهمة عقارية موثّقة مع مطور معتمد، حيث يتم التطوير والبيع مع حصول المالك على نسبة تخارج متفق عليها مسبقاً."
                        : "The owner seeks to contribute their land through a documented real estate contribution model with a certified developer, where the land is developed and sold with the owner receiving a pre-agreed exit percentage.")
                      : (isAr
                        ? "يهدف المالك إلى شراكة تطويرية مع مطور عقاري معتمد لتحقيق أقصى قيمة من الأرض، مع توفير كامل الدعم والمرونة في آلية الشراكة."
                        : "The owner seeks a development partnership with a certified developer to maximize the land's value, offering full support and flexibility in the partnership structure.")
                    }
                  </p>
                </div>

                {/* Dimensions */}
                {(land.length_m || land.width_m || land.street_width_m) && (
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <h3 className="text-[13px] font-semibold text-sina-charcoal mb-4">{isAr ? "المعايير الهندسية" : "Dimensions"}</h3>
                    <div className="grid grid-cols-3 gap-4">
                      {land.length_m && (
                        <div className="bg-white rounded-lg p-4 border border-gray-100 text-center">
                          <MoveVertical className="mx-auto h-4 w-4 text-sina-blue mb-2" strokeWidth={1.5} />
                          <p className="text-[15px] font-semibold text-sina-charcoal">{land.length_m} <span className="text-[11px] text-gray-400">{isAr ? "م" : "m"}</span></p>
                          <p className="text-[11px] text-gray-400 mt-1">{isAr ? "الطول" : "Length"}</p>
                        </div>
                      )}
                      {land.width_m && (
                        <div className="bg-white rounded-lg p-4 border border-gray-100 text-center">
                          <MoveHorizontal className="mx-auto h-4 w-4 text-sina-blue mb-2" strokeWidth={1.5} />
                          <p className="text-[15px] font-semibold text-sina-charcoal">{land.width_m} <span className="text-[11px] text-gray-400">{isAr ? "م" : "m"}</span></p>
                          <p className="text-[11px] text-gray-400 mt-1">{isAr ? "العرض" : "Width"}</p>
                        </div>
                      )}
                      {land.street_width_m && (
                        <div className="bg-white rounded-lg p-4 border border-gray-100 text-center">
                          <Route className="mx-auto h-4 w-4 text-sina-blue mb-2" strokeWidth={1.5} />
                          <p className="text-[15px] font-semibold text-sina-charcoal">{land.street_width_m} <span className="text-[11px] text-gray-400">{isAr ? "م" : "m"}</span></p>
                          <p className="text-[11px] text-gray-400 mt-1">{isAr ? "عرض الشارع" : "Street Width"}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Advantages */}
              <div>
                <h2 className="text-lg font-bold text-sina-charcoal mb-5">
                  {isAr ? "مزايا هذه الفرصة" : "Opportunity Advantages"}
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {features.map((f, idx) => (
                    <div key={idx} className="flex gap-4 p-5 bg-[#F7F9FB] rounded-xl border border-gray-100">
                      <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-lg bg-sina-blue/10 text-sina-blue">
                        <f.icon className="h-5 w-5" strokeWidth={1.5} />
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-sina-charcoal mb-1">{f.title}</p>
                        <p className="text-[12px] text-gray-500 leading-relaxed">{f.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="bg-[#F7F9FB] rounded-xl p-7 border border-gray-100 sticky top-28">
                <h3 className="text-[15px] font-bold text-sina-charcoal mb-5">{isAr ? "ملخص الفرصة" : "Summary"}</h3>

                <div className="space-y-0 border-t border-gray-200">
                  {summaryItems.map((item, i) => (
                    <div key={i} className="flex justify-between py-3.5 border-b border-gray-200 last:border-0">
                      <span className="text-[12px] text-gray-400">{item.label}</span>
                      <span className="text-[12px] font-medium text-sina-charcoal">{item.value}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 space-y-3">
                  <Link
                    to="/auth/login"
                    className="flex items-center justify-center gap-2 w-full h-12 bg-sina-blue text-white text-[13px] font-semibold rounded-lg hover:bg-sina-dark-blue transition-colors"
                  >
                    <Handshake className="w-4 h-4" />
                    {isAr ? "دخول المطورين" : "Developer Login"}
                  </Link>
                  <Link
                    to="/auth/login?type=owner"
                    className="flex items-center justify-center w-full h-12 bg-white text-sina-charcoal text-[13px] font-semibold rounded-lg border border-gray-200 hover:border-sina-blue/30 hover:bg-gray-50 transition-colors"
                  >
                    {isAr ? "دخول الملاك" : "Owner Login"}
                  </Link>
                </div>

                <div className="mt-5 flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-100">
                  <Shield className="h-4 w-4 text-sina-blue mt-0.5 shrink-0" strokeWidth={1.5} />
                  <p className="text-[11px] text-gray-500 leading-[1.7]">
                    {isAr
                      ? "للاطلاع على تفاصيل الموقع الدقيق وبيانات الصك، يرجى التسجيل كمطور معتمد."
                      : "To access exact location and deed details, please register as a certified developer."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
};

export default OpportunityDetail;
