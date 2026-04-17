import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Monitor, BarChart3, Bell, Users } from "lucide-react";

const PreviewSection: React.FC = () => {
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";

  return (
    <section className="py-14 lg:py-16 bg-white overflow-hidden" dir={isAr ? "rtl" : "ltr"}>
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1E374B] mb-4 tracking-tight">
            {t.preview.title}
          </h2>
          <p className="text-[15px] text-gray-500 max-w-2xl mx-auto leading-relaxed">
            {t.preview.subtitle}
          </p>
        </div>

        {/* Mockup preview with glow */}
        <div className="relative max-w-4xl mx-auto">
          {/* Glow effect */}
          <div className="absolute -inset-8 bg-gradient-to-b from-[#2B4C66]/[0.06] via-[#2B4C66]/[0.03] to-transparent rounded-[40px] blur-2xl" />

          <div className="relative bg-[#1E374B] rounded-2xl p-2 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
                <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
                <div className="w-3 h-3 rounded-full bg-[#28C840]" />
              </div>
            </div>
            {/* Dashboard mockup */}
            <div className="bg-[#F7F9FB] rounded-b-xl p-6 min-h-[380px]">
              {/* Top KPIs */}
              <div className="grid grid-cols-4 gap-3 mb-6">
                {[
                  { icon: Users, label: isAr ? "المطورين" : "Developers", val: "127" },
                  { icon: BarChart3, label: isAr ? "الصفقات" : "Deals", val: "89" },
                  { icon: Monitor, label: isAr ? "الأراضي" : "Lands", val: "352" },
                  { icon: Bell, label: isAr ? "التنبيهات" : "Alerts", val: "14" },
                ].map((kpi, i) => (
                  <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-2.5">
                      <kpi.icon className="w-4 h-4 text-[#2B4C66]" strokeWidth={1.5} />
                      <span className="text-[11px] text-gray-400 font-medium">{kpi.label}</span>
                    </div>
                    <div className="text-xl font-bold text-[#1E374B]">{kpi.val}</div>
                  </div>
                ))}
              </div>
              {/* Chart area */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 bg-white rounded-xl p-4 border border-gray-100 shadow-sm h-48 flex items-end gap-1.5 pb-6 px-6">
                  {[40, 65, 45, 80, 55, 70, 90, 60, 85, 75, 95, 50].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t transition-all duration-500"
                      style={{
                        height: `${h}%`,
                        background: `linear-gradient(to top, #2B4C66, #2B4C66${Math.round(h * 0.6 + 40).toString(16)})`,
                        opacity: 0.25 + (h / 100) * 0.5,
                      }}
                    />
                  ))}
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm h-48 flex flex-col justify-between">
                  {[
                    { label: isAr ? "مكتملة" : "Completed", pct: "72%", color: "bg-emerald-400" },
                    { label: isAr ? "قيد التنفيذ" : "In Progress", pct: "20%", color: "bg-[#2B4C66]" },
                    { label: isAr ? "معلّقة" : "Pending", pct: "8%", color: "bg-gray-300" },
                  ].map((s, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] text-gray-500">{s.label}</span>
                        <span className="text-[10px] font-semibold text-[#1E374B]">{s.pct}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${s.color} rounded-full`} style={{ width: s.pct }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PreviewSection;
