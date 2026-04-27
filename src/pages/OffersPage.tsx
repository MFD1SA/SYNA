import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { getActiveOffers, usageTypeLabels, offerTypeLabels, type RealEstateOffer } from "@/data/offers";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Ruler, Handshake, Gem, Sparkles, ArrowUpRight, Landmark, ShieldCheck } from "lucide-react";
import InnerHero from "@/components/landing/InnerHero";
import heroImg from "@/assets/hero/offers.svg";
// Saudi 3D fallback assets for offer cards missing an imageUrl —
// rotated by a hash of the offer id so each card gets a stable image.
import fallback1 from "@/assets/riyadh-kafd-elite.png";
import fallback2 from "@/assets/riyadh-residential.png";
import fallback3 from "@/assets/riyadh-kafd.png";
const fallbackImages = [fallback1, fallback2, fallback3];
const pickFallback = (id: string): string => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return fallbackImages[h % fallbackImages.length];
};

type UnifiedItem = {
  id: string;
  source: "offer" | "land";
  type: "partnership" | "contribution" | "land";
  title: { ar: string; en: string };
  description?: { ar: string; en: string };
  city: { ar: string; en: string };
  district: { ar: string; en: string };
  area_sqm: number;
  imageUrl?: string;
  usageType?: string;
  link: string;
};

const OffersPage: React.FC = () => {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  usePageTitle(isAr ? "العروض العقارية" : "Real Estate Offers");

  const [items, setItems] = useState<UnifiedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChip, setActiveChip] = useState<"all" | "partnership" | "investment" | "lands">("all");

  useEffect(() => {
    const load = async () => {
      try {
        const [offersData, landsRes] = await Promise.all([
          getActiveOffers(),
          supabase
            .from("lands" as any)
            .select("id, city, district, land_area_sqm, land_type, status, image_url")
            .in("status", ["active", "active_approved"])
            .order("created_at", { ascending: false }),
        ]);

        const offerItems: UnifiedItem[] = (offersData as RealEstateOffer[]).map((o) => ({
          id: `offer-${o.id}`,
          source: "offer",
          type: o.type,
          title: o.title,
          description: o.description,
          city: o.city,
          district: o.district,
          area_sqm: o.area_sqm,
          imageUrl: o.imageUrl,
          usageType: o.usageType,
          link: `/offers/${o.id}`,
        }));

        const landRows = (landsRes?.data || []) as unknown as Array<{
          id: string;
          city: string;
          district: string | null;
          land_area_sqm: number;
          land_type: string | null;
          status: string;
          image_url: string | null;
        }>;

        const landItems: UnifiedItem[] = landRows.map((l) => ({
          id: `land-${l.id}`,
          source: "land",
          type: "land",
          title: {
            ar: `${l.city}${l.district ? ` — ${l.district}` : ""}`,
            en: `${l.city}${l.district ? ` — ${l.district}` : ""}`,
          },
          city: { ar: l.city, en: l.city },
          district: { ar: l.district || "", en: l.district || "" },
          area_sqm: Number(l.land_area_sqm || 0),
          imageUrl: l.image_url || undefined,
          usageType: l.land_type || undefined,
          link: `/opportunity/${l.id}`,
        }));

        setItems([...offerItems, ...landItems]);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    if (activeChip === "all") return items;
    if (activeChip === "lands") return items.filter((i) => i.source === "land");
    if (activeChip === "partnership") return items.filter((i) => i.type === "partnership");
    if (activeChip === "investment") return items.filter((i) => i.type === "contribution");
    return items;
  }, [items, activeChip]);

  return (
    <div className="min-h-screen bg-[#FAFBFC] relative overflow-hidden" dir={isAr ? "rtl" : "ltr"}>
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute -top-24 end-[-10%] w-[520px] h-[520px] rounded-full bg-[#C45A41]/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] start-[-8%] w-[560px] h-[560px] rounded-full bg-[#2B2B2B]/10 blur-[130px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#FAFBFC] via-white to-[#FAFBFC]" />
      </div>

      <div className="relative z-10">
        <Navbar />

        <InnerHero
          pageSlug="offers"
          title={isAr ? "العروض العقارية" : "Real Estate Offers"}
          subtitle={isAr
            ? "اكتشف أبرز الفرص العقارية في المملكة العربية السعودية وشراكات التطوير والمساهمات في مواقع استراتيجية"
            : "Discover premier real estate opportunities across Saudi Arabia with development partnerships and contributions in strategic locations"
          }
          isAr={isAr}
          image={heroImg}
          illustrated
        />

        <section className="-mt-10 relative z-10 pb-24">
          <div className="max-w-7xl mx-auto px-6">

            {/* Privacy disclaimer — opportunities shown are demonstrative, not real listings */}
            <div className="mb-6 rounded-2xl bg-gradient-to-r from-[#2B2B2B]/[0.06] via-[#C45A41]/[0.08] to-[#2B2B2B]/[0.06] ring-1 ring-[#C45A41]/30 px-5 md:px-6 py-4 md:py-4.5 flex items-start gap-3.5">
              <ShieldCheck className="w-5 h-5 md:w-6 md:h-6 text-[#A24832] shrink-0 mt-0.5" strokeWidth={1.7} />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] md:text-[14px] font-bold text-[#020202] mb-1 leading-snug">
                  {isAr ? "الفرص المعروضة أمثلة توضيحية" : "Displayed opportunities are illustrative examples"}
                </p>
                <p className="text-[12px] md:text-[12.5px] text-gray-600 leading-[1.8]">
                  {isAr
                    ? "حفاظاً على خصوصية الملاك وحماية بياناتهم، جميع الفرص والصور المعروضة هنا تمثيلية لأغراض العرض فقط — الفرص الفعلية تُكشف للمطورين الموثّقين بعد التسجيل وتوقيع اتفاقية السرية."
                    : "To protect landowner privacy, all opportunities and images shown are demonstrative only — actual opportunities are revealed to verified developers after registration and NDA signing."}
                </p>
              </div>
            </div>

            {!loading && items.length > 0 && (
              <div className="mb-10 rounded-3xl bg-white ring-1 ring-slate-200/70 shadow-[0_8px_30px_-12px_rgba(15,31,46,0.08)] px-6 md:px-8 py-6 md:py-7 relative overflow-hidden">
                <div className="absolute top-0 start-0 w-full h-0.5 bg-gradient-to-r from-[#C45A41]/60 via-[#2B2B2B]/40 to-[#C45A41]/60" />
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                  <div className="flex items-center gap-4">
                    <Sparkles className="w-6 h-6 text-[#A24832]" strokeWidth={1.7} />
                    <div>
                      <p className="text-[28px] md:text-[32px] font-bold text-[#020202] leading-none tracking-tight" dir="ltr">
                        {filtered.length}
                      </p>
                      <p className="text-[12px] md:text-[13px] text-gray-500 font-semibold mt-1 tracking-wide">
                        {isAr ? "نتائج نشطة" : "Active results"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {([
                      { id: "all", labelAr: "الكل", labelEn: "All" },
                      { id: "partnership", labelAr: "شراكات", labelEn: "Partnerships" },
                      { id: "investment", labelAr: "استثمارات", labelEn: "Investments" },
                      { id: "lands", labelAr: "أراضٍ", labelEn: "Lands" },
                    ] as const).map((chip) => {
                      const active = activeChip === chip.id;
                      return (
                        <button
                          key={chip.id}
                          onClick={() => setActiveChip(chip.id)}
                          className={`inline-flex items-center h-9 px-4 rounded-full text-[12.5px] font-bold transition-all ${
                            active
                              ? "bg-gradient-to-r from-[#2B2B2B] to-[#020202] text-white shadow-[0_6px_16px_-6px_rgba(43,76,102,0.5)]"
                              : "bg-slate-50 text-gray-500 hover:bg-slate-100 hover:text-[#020202] ring-1 ring-slate-200/70"
                          }`}
                        >
                          {isAr ? chip.labelAr : chip.labelEn}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {loading ? (
              <div className="grid gap-6 md:gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map(i => <div key={i} className="h-[460px] animate-pulse rounded-3xl bg-white ring-1 ring-slate-200/60" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-28 text-center">
                <MapPin className="h-10 w-10 text-[#A24832] mx-auto mb-6" strokeWidth={1.6} />
                <h3 className="text-[18px] md:text-[20px] font-bold text-[#020202] mb-2">
                  {isAr ? "لا توجد عروض نشطة حالياً" : "No active offers right now"}
                </h3>
                <p className="text-[13px] md:text-[14px] text-gray-500 max-w-md mx-auto leading-relaxed">
                  {isAr
                    ? "نعمل باستمرار على إضافة فرص جديدة. عُد قريباً لاستكشاف آخر عروض الشراكة والاستثمار."
                    : "We're constantly curating new opportunities. Check back soon for fresh partnership and investment offers."}
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((item) => {
                  const isPartnership = item.type === "partnership";
                  const isLand = item.source === "land";
                  const typeLabel = isLand
                    ? { ar: "أرض متاحة", en: "Available Land" }
                    : offerTypeLabels[item.type];
                  return (
                    <Link
                      key={item.id}
                      to={item.link}
                      className="group bg-white rounded-3xl overflow-hidden transition-all duration-300 ring-1 ring-slate-200/70 hover:ring-slate-300/80 shadow-[0_4px_18px_-8px_rgba(15,31,46,0.08)] hover:shadow-[0_18px_48px_-16px_rgba(15,31,46,0.22)] hover:-translate-y-1 flex flex-col"
                    >
                      <div className="relative h-[240px] md:h-[260px] overflow-hidden">
                        <img
                          src={item.imageUrl || pickFallback(item.id)}
                          alt={isAr ? item.title.ar : item.title.en}
                          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.08]"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />

                        <div className="absolute top-4 start-4">
                          <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-bold tracking-wide backdrop-blur-md text-white ${
                            isLand ? "bg-[#A24832]/85" : isPartnership ? "bg-[#2B2B2B]/85" : "bg-emerald-600/85"
                          }`}>
                            {isLand
                              ? <Landmark className="w-3 h-3" strokeWidth={2} />
                              : isPartnership ? <Handshake className="w-3 h-3" strokeWidth={2} /> : <Gem className="w-3 h-3" strokeWidth={2} />}
                            {isAr ? typeLabel.ar : typeLabel.en}
                          </span>
                        </div>

                        <div className="absolute bottom-4 start-4 end-4 flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-white/90 shrink-0" strokeWidth={2} />
                          <span className="text-[13px] font-semibold text-white drop-shadow-sm">
                            {isAr ? item.city.ar : item.city.en}
                            {item.district.ar && ` | ${isAr ? item.district.ar : item.district.en}`}
                          </span>
                        </div>
                      </div>

                      <div className="p-5 md:p-6 flex flex-col flex-1">
                        <h3 className="text-[16.5px] md:text-[17px] font-bold text-gray-900 mb-3 leading-snug line-clamp-2 group-hover:text-[#2B2B2B] transition-colors duration-200">
                          {isAr ? item.title.ar : item.title.en}
                        </h3>
                        {item.description && (
                          <p className="text-[13px] text-gray-500 leading-relaxed line-clamp-2 mb-5">
                            {isAr ? item.description.ar : item.description.en}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-2 mb-5">
                          {item.usageType && usageTypeLabels[item.usageType] && (
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#2B2B2B]/[0.06] text-[11px] font-bold text-[#2B2B2B] tracking-wide">
                              {isAr ? usageTypeLabels[item.usageType].ar : usageTypeLabels[item.usageType].en}
                            </span>
                          )}
                          {item.usageType && !usageTypeLabels[item.usageType] && (
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#2B2B2B]/[0.06] text-[11px] font-bold text-[#2B2B2B] tracking-wide">
                              {item.usageType}
                            </span>
                          )}
                          {item.area_sqm > 0 && (
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-50 text-[11px] font-bold text-gray-600 tracking-wide">
                              <Ruler className="h-3 w-3" strokeWidth={1.8} />
                              {item.area_sqm.toLocaleString("en-US")} {isAr ? "م²" : "sqm"}
                            </span>
                          )}
                        </div>

                        <div className="mt-auto">
                          <span className="group/cta flex w-full items-center justify-center gap-2 h-[46px] rounded-xl bg-gradient-to-r from-[#2B2B2B] to-[#020202] text-white text-[13px] font-bold shadow-[0_6px_18px_-6px_rgba(43,76,102,0.45)] group-hover:shadow-[0_10px_24px_-8px_rgba(43,76,102,0.55)] transition-all">
                            {isAr ? "عرض التفاصيل" : "View Details"}
                            <ArrowUpRight className="h-3.5 w-3.5 opacity-80 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" strokeWidth={2} />
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <Footer />
      </div>
    </div>
  );
};

export default OffersPage;
