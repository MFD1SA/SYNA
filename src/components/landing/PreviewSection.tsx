import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Monitor, BarChart3, Bell, Users } from "lucide-react";

const PreviewSection: React.FC = () => {
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";

  return (
    <section className="py-16 lg:py-20 bg-white" dir={isAr ? "rtl" : "ltr"}>
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-sina-charcoal mb-4">
            {t.preview.title}
          </h2>
          <p className="text-[15px] text-gray-500 max-w-2xl mx-auto leading-relaxed">
            {t.preview.subtitle}
          </p>
        </div>

        {/* Mockup preview */}
        <div className="relative max-w-4xl mx-auto">
          <div className="bg-sina-charcoal rounded-2xl p-2 shadow-2xl">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
              </div>
              <div className="flex-1 mx-12">
                <div className="bg-white/10 rounded-md h-6 flex items-center justify-center">
                  <span className="text-[10px] text-white/40 font-mono">sina.sa/dashboard</span>
                </div>
              </div>
            </div>
            {/* Dashboard mockup */}
            <div className="bg-[#F7F9FB] rounded-b-xl p-6 min-h-[360px]">
              {/* Top KPIs */}
              <div className="grid grid-cols-4 gap-3 mb-6">
                {[
                  { icon: Users, label: isAr ? "المطورين" : "Developers", val: "127" },
                  { icon: BarChart3, label: isAr ? "الصفقات" : "Deals", val: "89" },
                  { icon: Monitor, label: isAr ? "الأراضي" : "Lands", val: "352" },
                  { icon: Bell, label: isAr ? "التنبيهات" : "Alerts", val: "14" },
                ].map((kpi, i) => (
                  <div key={i} className="bg-white rounded-lg p-4 border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <kpi.icon className="w-4 h-4 text-sina-blue" strokeWidth={1.5} />
                      <span className="text-[11px] text-gray-400">{kpi.label}</span>
                    </div>
                    <div className="text-xl font-bold text-sina-charcoal">{kpi.val}</div>
                  </div>
                ))}
              </div>
              {/* Chart placeholder */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 bg-white rounded-lg p-4 border border-gray-100 h-48 flex items-end gap-1.5 pb-6 px-6">
                  {[40, 65, 45, 80, 55, 70, 90, 60, 85, 75, 95, 50].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-sina-blue/20 rounded-t"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-100 h-48 flex flex-col justify-between">
                  {[
                    { label: isAr ? "مكتملة" : "Completed", pct: "72%", color: "bg-emerald-400" },
                    { label: isAr ? "قيد التنفيذ" : "In Progress", pct: "20%", color: "bg-sina-blue" },
                    { label: isAr ? "معلّقة" : "Pending", pct: "8%", color: "bg-gray-300" },
                  ].map((s, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] text-gray-500">{s.label}</span>
                        <span className="text-[10px] font-semibold text-sina-charcoal">{s.pct}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
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
