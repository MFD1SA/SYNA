import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { MapPin, Ruler, Layers, ArrowRight, ArrowLeft, Building2, Target, TrendingUp, Shield, CheckCircle2 } from "lucide-react";

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
  "Al Malqa": "الملقا",
  "Al Shati": "الشاطئ",
  "Al Faisaliyah": "الفيصلية",
  "Al Awali": "العوالي",
  "Al Uyun": "العيون",
  "Al Hada": "الهدا",
  "Al Corniche": "الكورنيش",
  "Al Muruj": "المروج",
  "Al Sadd": "السد",
  "Al Rawdah": "الروضة",
  "Al Olaya": "العليا",
  "Al Wurud": "الورود",
  "Al Nakheel": "النخيل",
  "Al Hamra": "الحمراء",
  "Al Sulaimaniyah": "السليمانية",
  "Al Rabwah": "الربوة",
  "Al Zahra": "الزهراء",
  "Al Aziziyah": "العزيزية",
  "Al Khalidiyah": "الخالدية",
  "Al Naseem": "النسيم",
};

const goalLabels: Record<string, { ar: string; en: string }> = {
  develop_sell: { ar: "تطوير وبيع", en: "Develop & Sell" },
  develop_rent: { ar: "تطوير وتأجير", en: "Develop & Rent" },
  develop_mixed: { ar: "مختلط", en: "Mixed Development" },
  develop_complex: { ar: "مجمع متكامل", en: "Integrated Complex" },
  sell_develop: { ar: "بيع وتطوير", en: "Sell & Develop" },
  partial_exit: { ar: "تخارج جزئي", en: "Partial Exit" },
  offplan_sell: { ar: "تطوير وبيع على الخارطة", en: "Off-Plan Sell" },
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
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center py-40 text-muted-foreground">
          {isAr ? "جاري التحميل..." : "Loading..."}
        </div>
      </div>
    );
  }

  if (!land) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-40 gap-4">
          <p className="text-muted-foreground">{isAr ? "لم يتم العثور على هذه الفرصة" : "Opportunity not found"}</p>
          <Button onClick={() => navigate("/")}>{isAr ? "العودة للرئيسية" : "Back to Home"}</Button>
        </div>
      </div>
    );
  }

  const imgSrc = land.image_url || placeholders[0];
  const cityAr = cityNameAr[land.city] || land.city;

  const features = [
    {
      icon: Shield,
      title: isAr ? "خصوصية تامة" : "Full Privacy",
      desc: isAr ? "بيانات الصك والموقع الدقيق محمية ولا تظهر إلا بعد موافقة المالك" : "Deed details and exact location are protected and only revealed after owner approval",
    },
    {
      icon: Target,
      title: isAr ? "فرصة مدروسة" : "Vetted Opportunity",
      desc: isAr ? "تم التحقق من ملكية الأرض ومطابقتها للأنظمة البلدية" : "Land ownership has been verified and complies with municipal regulations",
    },
    {
      icon: TrendingUp,
      title: isAr ? "عائد استثماري مميز" : "Attractive ROI",
      desc: isAr ? "موقع استراتيجي يضمن عوائد استثمارية مجزية للمطور" : "Strategic location ensuring attractive investment returns for the developer",
    },
    {
      icon: Building2,
      title: isAr ? "دعم متكامل" : "Full Support",
      desc: isAr ? "فريق سينا يرافقك في كل مرحلة من التفاوض حتى إتمام الصفقة" : "SYNA team accompanies you from negotiation to deal closure",
    },
  ];

  return (
    <div className="min-h-screen bg-[hsl(210,30%,4%)]">
      <Navbar />
      <main className="pt-20">
        {/* Cinematic Hero */}
        <div className="relative h-[60vh] min-h-[480px] overflow-hidden">
          <img src={imgSrc} alt={cityAr} className="absolute inset-0 h-full w-full object-cover object-center scale-105 transition-transform duration-[3s] hover:scale-100" />
          <div className="absolute inset-0 bg-gradient-to-t from-[hsl(210,30%,4%)] via-black/40 to-black/10" />
          <div className="absolute inset-0 bg-gradient-to-r from-[hsl(210,30%,4%,0.5)] to-transparent" />

          {/* Decorative overlay line */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[hsl(200,80%,45%,0.3)] to-transparent" />

          <div className="absolute bottom-0 inset-x-0 pb-10 pt-20 container">
            <Button
              variant="ghost"
              className="text-white/60 hover:text-white hover:bg-white/10 mb-6 gap-2 -ms-3 text-xs"
              onClick={() => navigate("/")}
            >
              {isAr ? <ArrowRight className="h-3.5 w-3.5" /> : <ArrowLeft className="h-3.5 w-3.5" />}
              {isAr ? "العودة للفرص" : "Back to Opportunities"}
            </Button>

            <div className="flex items-end justify-between gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="rounded-full syna-gradient px-4 py-1.5 text-[11px] font-medium text-white shadow-lg">
                    {isAr ? "فرصة تطويرية" : "Development Opportunity"}
                  </span>
                  <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-medium text-white backdrop-blur-md">
                    {isAr ? usageLabels[land.usage_type]?.ar : usageLabels[land.usage_type]?.en}
                  </span>
                </div>
                <h1 className="text-3xl md:text-5xl font-medium text-white leading-tight">
                  {isAr
                    ? `أرض ${land.district ? `حي ${districtNameAr[land.district] || land.district} — ` : ""}${cityAr}`
                    : `Land${land.district ? ` in ${land.district},` : ""} ${land.city}`
                  }
                </h1>
                <div className="flex items-center gap-4 text-sm text-white/60">
                  <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{isAr ? cityAr : land.city}</span>
                  <span className="h-3 w-px bg-white/20" />
                  <span className="flex items-center gap-1.5"><Ruler className="h-3.5 w-3.5" />{land.land_area_sqm?.toLocaleString()} {isAr ? "م²" : "sqm"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container py-10">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Key Info Cards */}
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="rounded-2xl border border-[hsl(210,22%,12%)] bg-[hsl(210,28%,7%)] p-5 text-center">
                  <Ruler className="mx-auto h-5 w-5 text-[hsl(200,80%,55%)] mb-2" />
                  <p className="text-2xl font-medium text-white">{land.land_area_sqm?.toLocaleString()}</p>
                  <p className="text-xs text-[hsl(210,15%,50%)]">{isAr ? "متر مربع" : "Square Meters"}</p>
                </div>
                <div className="rounded-2xl border border-[hsl(210,22%,12%)] bg-[hsl(210,28%,7%)] p-5 text-center">
                  <Layers className="mx-auto h-5 w-5 text-[hsl(200,80%,55%)] mb-2" />
                  <p className="text-lg font-medium text-white">
                    {isAr ? usageLabels[land.usage_type]?.ar : usageLabels[land.usage_type]?.en}
                  </p>
                  <p className="text-xs text-[hsl(210,15%,50%)]">{isAr ? "نوع الاستخدام" : "Usage Type"}</p>
                </div>
                <div className="rounded-2xl border border-[hsl(210,22%,12%)] bg-[hsl(210,28%,7%)] p-5 text-center">
                  <MapPin className="mx-auto h-5 w-5 text-[hsl(200,80%,55%)] mb-2" />
                  <p className="text-lg font-medium text-white">
                    {isAr ? cityAr : land.city}
                  </p>
                  <p className="text-xs text-[hsl(210,15%,50%)]">{isAr ? "المدينة" : "City"}</p>
                </div>
              </div>

              {/* Description */}
              <div className="rounded-2xl border border-[hsl(210,22%,12%)] bg-[hsl(210,28%,7%)] p-6">
                <h2 className="text-lg font-medium text-foreground mb-4">
                  {isAr ? "تفاصيل الفرصة" : "Opportunity Details"}
                </h2>
                <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                  <p>
                    {isAr
                      ? `تتوفر أرض ${usageLabels[land.usage_type]?.ar || ""} بمساحة ${land.land_area_sqm?.toLocaleString()} متر مربع في ${land.district ? `حي ${districtNameAr[land.district] || land.district} ب` : ""}${cityAr}، وهي فرصة استثمارية مميزة لتطوير ${land.project_type || "مشروع عقاري"} يلبي الطلب المتنامي على العقارات في المنطقة.`
                      : `A ${usageLabels[land.usage_type]?.en || ""} land spanning ${land.land_area_sqm?.toLocaleString()} sqm is available in ${land.district ? `${land.district}, ` : ""}${land.city}. This is a premium investment opportunity to develop ${land.project_type || "a real estate project"} that meets the growing demand in the area.`
                    }
                  </p>
                  {land.vision_summary && (
                    <p>{land.vision_summary}</p>
                  )}
                  <p>
                    {isAr
                      ? "يهدف المالك إلى شراكة تطويرية مع مطور عقاري معتمد لتحقيق أقصى قيمة من الأرض، مع توفير كامل الدعم والمرونة في آلية الشراكة."
                      : "The owner seeks a development partnership with a certified developer to maximize the land's value, offering full support and flexibility in the partnership structure."
                    }
                  </p>
                </div>

                {/* Land dimensions */}
                {(land.length_m || land.width_m || land.street_width_m) && (
                  <div className="mt-6 grid grid-cols-3 gap-3">
                    {land.length_m && (
                      <div className="rounded-xl bg-[hsl(210,25%,11%)] p-3 text-center">
                        <p className="text-sm font-medium text-white">{land.length_m} {isAr ? "م" : "m"}</p>
                        <p className="text-xs text-[hsl(210,15%,50%)]">{isAr ? "الطول" : "Length"}</p>
                      </div>
                    )}
                    {land.width_m && (
                      <div className="rounded-xl bg-[hsl(210,25%,11%)] p-3 text-center">
                        <p className="text-sm font-medium text-white">{land.width_m} {isAr ? "م" : "m"}</p>
                        <p className="text-xs text-[hsl(210,15%,50%)]">{isAr ? "العرض" : "Width"}</p>
                      </div>
                    )}
                    {land.street_width_m && (
                      <div className="rounded-xl bg-[hsl(210,25%,11%)] p-3 text-center">
                        <p className="text-sm font-medium text-white">{land.street_width_m} {isAr ? "م" : "m"}</p>
                        <p className="text-xs text-[hsl(210,15%,50%)]">{isAr ? "عرض الشارع" : "Street Width"}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Why This Opportunity */}
              <div className="rounded-2xl border border-[hsl(210,22%,12%)] bg-[hsl(210,28%,7%)] p-6">
                <h2 className="text-lg font-medium text-white mb-4">
                  {isAr ? "لماذا هذه الفرصة؟" : "Why This Opportunity?"}
                </h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {features.map((f, idx) => (
                    <div key={idx} className="flex gap-3 p-3 rounded-xl bg-[hsl(210,25%,11%)] border border-[hsl(210,22%,14%)]">
                      <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(200,80%,45%,0.1)]">
                        <f.icon className="h-5 w-5 text-[hsl(200,80%,55%)]" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{f.title}</p>
                        <p className="text-xs text-[hsl(210,15%,50%)] mt-0.5">{f.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <div className="rounded-2xl border border-[hsl(210,22%,12%)] bg-[hsl(210,28%,7%)] p-6 sticky top-24">
                <h3 className="text-base font-medium text-white mb-4">
                  {isAr ? "ملخص الفرصة" : "Opportunity Summary"}
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b border-[hsl(210,22%,14%)]">
                    <span className="text-[hsl(210,15%,50%)]">{isAr ? "نوع الأصل" : "Asset Type"}</span>
                    <span className="font-medium text-white">{isAr ? "أرض" : "Land"}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[hsl(210,22%,14%)]">
                    <span className="text-[hsl(210,15%,50%)]">{isAr ? "المساحة" : "Area"}</span>
                    <span className="font-medium text-white">{land.land_area_sqm?.toLocaleString()} {isAr ? "م²" : "sqm"}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[hsl(210,22%,14%)]">
                    <span className="text-[hsl(210,15%,50%)]">{isAr ? "المدينة" : "City"}</span>
                    <span className="font-medium text-white">{isAr ? cityAr : land.city}</span>
                  </div>
                  {land.district && (
                    <div className="flex justify-between py-2 border-b border-[hsl(210,22%,14%)]">
                      <span className="text-[hsl(210,15%,50%)]">{isAr ? "الحي" : "District"}</span>
                      <span className="font-medium text-white">{isAr ? (districtNameAr[land.district] || land.district) : land.district}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 border-b border-[hsl(210,22%,14%)]">
                    <span className="text-[hsl(210,15%,50%)]">{isAr ? "الاستخدام" : "Usage"}</span>
                    <span className="font-medium text-white">{isAr ? usageLabels[land.usage_type]?.ar : usageLabels[land.usage_type]?.en}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[hsl(210,22%,14%)]">
                    <span className="text-[hsl(210,15%,50%)]">{isAr ? "هدف الشراكة" : "Goal"}</span>
                    <span className="font-medium text-white">{isAr ? goalLabels[land.partnership_goal]?.ar : goalLabels[land.partnership_goal]?.en}</span>
                  </div>
                  {land.project_type && (
                    <div className="flex justify-between py-2 border-b border-[hsl(210,22%,14%)]">
                      <span className="text-[hsl(210,15%,50%)]">{isAr ? "نوع المشروع" : "Project Type"}</span>
                      <span className="font-medium text-white">{land.project_type}</span>
                    </div>
                  )}
                </div>

                <div className="mt-6 space-y-3">
                  <Button
                    className="w-full gap-2 syna-gradient border-0 text-white hover:opacity-90"
                    onClick={() => navigate("/auth/register")}
                  >
                    {isAr ? "سجل كمطور للتقديم" : "Register as Developer to Apply"}
                  </Button>
                  <Button variant="outline" className="w-full border-[hsl(210,22%,16%)] bg-transparent text-white hover:bg-[hsl(210,22%,14%)]" onClick={() => navigate("/auth/login")}>
                    {isAr ? "تسجيل الدخول" : "Login"}
                  </Button>
                </div>

                <div className="mt-4 flex items-start gap-2 p-3 rounded-xl bg-[hsl(200,80%,45%,0.06)] border border-[hsl(200,80%,45%,0.12)]">
                  <CheckCircle2 className="h-4 w-4 text-[hsl(200,80%,55%)] mt-0.5 shrink-0" />
                  <p className="text-[11px] text-[hsl(210,15%,50%)] leading-relaxed">
                    {isAr
                      ? "للاطلاع على تفاصيل الموقع الدقيق وبيانات الصك، يرجى التسجيل كمطور معتمد. سيتم مراجعة طلبك خلال 24 ساعة."
                      : "To access exact location details and deed information, please register as a certified developer. Your application will be reviewed within 24 hours."
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OpportunityDetail;
