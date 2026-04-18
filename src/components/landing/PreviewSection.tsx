import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Monitor, BarChart3, Bell, Users, TrendingUp, CheckCircle2 } from "lucide-react";

/**
 * Premium luxury preview section — showcases the platform as a polished
 * dashboard mockup. No decorative lines, no eyebrow badges, no wasted
 * space. Just the story: "this is what you'll be using."
 */
const PreviewSection: React.FC = () => {
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";

  return (
    <section
      className="relative py-16 md:py-24 lg:py-28 overflow-hidden bg-gradient-to-b from-white via-[#FAFBFC] to-white"
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* Ambient background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 start-1/3 w-[600px] h-[400px] rounded-full bg-[#2B4C66]/[0.04] blur-[100px]" />
        <div className="absolute bottom-1/4 end-1/3 w-[500px] h-[400px] rounded-full bg-[#C2A86B]/[0.06] blur-[100px]" />
      </div>

      <div className="container relative">
        {/* Heading — no accent rule, no eyebrow */}
        <div className="text-center mb-12 md:mb-16 max-w-3xl mx-auto">
          <h2 className="text-[28px] sm:text-[36px] md:text-[44px] lg:text-[52px] font-bold text-[#1E374B] tracking-tight leading-[1.1]">
            {t.preview.title}
          </h2>
          <p className="mt-5 md:mt-6 text-[15px] md:text-[17px] text-slate-600 leading-[1.8] max-w-2xl mx-auto">
            {t.preview.subtitle}
          </p>
        </div>

        {/* Premium dashboard mockup */}
        <div className="relative max-w-5xl mx-auto">
          {/* Outer soft glow */}
          <div className="absolute -inset-8 bg-gradient-to-b from-[#2B4C66]/10 via-[#2B4C66]/5 to-transparent rounded-[48px] blur-3xl" />
          <div className="absolute -inset-4 bg-gradient-to-tr from-[#C2A86B]/8 via-transparent to-[#2B4C66]/10 rounded-[40px] blur-2xl" />

          {/* Browser frame */}
          <div className="relative bg-gradient-to-br from-[#1E374B] via-[#2B4C66] to-[#1E374B] rounded-2xl md:rounded-3xl p-1.5 md:p-2 shadow-[0_30px_80px_-20px_rgba(15,31,46,0.35)] ring-1 ring-white/5">
            {/* Browser chrome */}
            <div className="flex items-center justify-between px-4 md:px-5 py-3 border-b border-white/10">
              <div className="flex gap-1.5">
                <div className="w-2.5 md:w-3 h-2.5 md:h-3 rounded-full bg-[#FF5F57]" />
                <div className="w-2.5 md:w-3 h-2.5 md:h-3 rounded-full bg-[#FEBC2E]" />
                <div className="w-2.5 md:w-3 h-2.5 md:h-3 rounded-full bg-[#28C840]" />
              </div>
              <div className="hidden sm:flex items-center gap-1.5 text-white/40 text-[10px] font-mono">
                <div className="w-1 h-1 rounded-full bg-emerald-400" />
                cidoma.com
              </div>
              <div className="hidden sm:block w-12" />
            </div>

            {/* Dashboard canvas */}
            <div className="bg-gradient-to-br from-[#F7F9FB] to-[#F0F3F7] rounded-b-xl md:rounded-b-2xl p-4 md:p-6 min-h-[360px] md:min-h-[460px]">
              {/* Top KPIs — richer visual */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-3 mb-5 md:mb-6">
                {[
                  { icon: Users,      label: isAr ? "المطورون"  : "Developers", val: "127", trend: "+12%", color: "from-[#2B4C66] to-[#1E374B]" },
                  { icon: BarChart3,  label: isAr ? "الصفقات"   : "Deals",      val: "89",  trend: "+8%",  color: "from-[#C2A86B] to-[#A88A4A]" },
                  { icon: Monitor,    label: isAr ? "الأراضي"   : "Lands",      val: "352", trend: "+24%", color: "from-emerald-500 to-emerald-600" },
                  { icon: Bell,       label: isAr ? "التنبيهات" : "Alerts",     val: "14",  trend: "live",  color: "from-amber-500 to-amber-600" },
                ].map((kpi, i) => (
                  <div key={i} className="relative bg-white rounded-xl md:rounded-2xl p-3 md:p-4 border border-gray-100 shadow-[0_2px_8px_-2px_rgba(15,31,46,0.06)] overflow-hidden">
                    <div className="flex items-start justify-between mb-2">
                      <div className={`w-7 h-7 md:w-8 md:h-8 rounded-lg md:rounded-xl bg-gradient-to-br ${kpi.color} flex items-center justify-center shadow-sm`}>
                        <kpi.icon className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" strokeWidth={1.8} />
                      </div>
                      <span className="text-[9px] md:text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                        {kpi.trend}
                      </span>
                    </div>
                    <p className="text-[10px] md:text-[11px] text-gray-400 font-semibold uppercase tracking-wider">{kpi.label}</p>
                    <p className="text-lg md:text-2xl font-bold text-[#1E374B] mt-0.5">{kpi.val}</p>
                  </div>
                ))}
              </div>

              {/* Bottom panels — chart + status breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 md:gap-3">
                {/* Bar chart */}
                <div className="md:col-span-2 bg-white rounded-xl md:rounded-2xl p-4 md:p-5 border border-gray-100 shadow-[0_2px_8px_-2px_rgba(15,31,46,0.06)]">
                  <div className="flex items-center justify-between mb-3 md:mb-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-[#2B4C66]" strokeWidth={1.8} />
                      <span className="text-[11px] md:text-[12px] font-bold text-[#1E374B]">
                        {isAr ? "النشاط خلال 12 شهر" : "12-month activity"}
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-[#C2A86B]">
                      {isAr ? "متوقّع" : "Projected"}
                    </span>
                  </div>
                  <div className="h-[120px] md:h-[160px] flex items-end gap-1 md:gap-1.5">
                    {[40, 65, 45, 80, 55, 70, 90, 60, 85, 75, 95, 72].map((h, i) => (
                      <div key={i} className="flex-1 relative group">
                        <div
                          className="rounded-t transition-all duration-500 group-hover:opacity-100"
                          style={{
                            height: `${h}%`,
                            background: i === 10
                              ? "linear-gradient(to top, #C2A86B, #D7C084)"
                              : "linear-gradient(to top, #2B4C66, #3A6088)",
                            opacity: 0.3 + (h / 100) * 0.5,
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status breakdown */}
                <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-5 border border-gray-100 shadow-[0_2px_8px_-2px_rgba(15,31,46,0.06)] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" strokeWidth={1.8} />
                      <span className="text-[11px] md:text-[12px] font-bold text-[#1E374B]">
                        {isAr ? "حالة الصفقات" : "Deal status"}
                      </span>
                    </div>
                    <div className="space-y-3 md:space-y-4">
                      {[
                        { label: isAr ? "مكتملة" : "Completed", pct: "72%", width: 72, color: "from-emerald-400 to-emerald-500" },
                        { label: isAr ? "قيد التنفيذ" : "In Progress", pct: "20%", width: 20, color: "from-[#2B4C66] to-[#3A6088]" },
                        { label: isAr ? "معلّقة" : "Pending", pct: "8%", width: 8, color: "from-[#C2A86B] to-[#D7C084]" },
                      ].map((s, i) => (
                        <div key={i}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] md:text-[11px] text-gray-500 font-medium">{s.label}</span>
                            <span className="text-[11px] md:text-[12px] font-bold text-[#1E374B] tabular-nums" dir="ltr">{s.pct}</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full bg-gradient-to-r ${s.color} rounded-full transition-all duration-700`} style={{ width: `${s.width}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Caption */}
          <p className="text-center mt-8 md:mt-10 text-[12px] md:text-[13px] text-slate-500 font-medium">
            {isAr
              ? "عرض توضيحي لواجهة الأدمن — الأرقام للعرض فقط"
              : "Illustrative admin dashboard — figures shown for demo purposes"}
          </p>
        </div>
      </div>
    </section>
  );
};

export default PreviewSection;
