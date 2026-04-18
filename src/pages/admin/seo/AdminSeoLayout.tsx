import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import AdminLayout from "@/components/admin/AdminLayout";
import {
  LayoutDashboard, FileText, FileCog, Layers, Filter, Repeat2, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const AdminSeoLayout: React.FC = () => {
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  const tabs = [
    { to: "/admincp/seo", end: true, label: isAr ? "نظرة عامة" : "Overview", icon: LayoutDashboard },
    { to: "/admincp/seo/pages", label: isAr ? "الصفحات" : "Pages", icon: FileText },
    { to: "/admincp/seo/templates", label: isAr ? "القوالب" : "Templates", icon: FileCog },
    { to: "/admincp/seo/entities", label: isAr ? "الكيانات" : "Entities", icon: Layers },
    { to: "/admincp/seo/rules", label: isAr ? "القواعد" : "Rules", icon: Filter },
    { to: "/admincp/seo/redirects", label: isAr ? "التحويلات" : "Redirects", icon: Repeat2 },
    { to: "/admincp/seo/issues", label: isAr ? "المشاكل" : "Issues", icon: AlertTriangle },
  ];

  return (
    <AdminLayout>
      <div dir={isAr ? "rtl" : "ltr"}>
        <header className="mb-6">
          <h1 className="text-[24px] md:text-[28px] font-bold text-[#1E374B] tracking-tight">
            {isAr ? "مركز التحكم في SEO" : "SEO Control Center"}
          </h1>
          <p className="mt-1 text-[13px] text-slate-500">
            {isAr
              ? "إدارة التوليد الآلي للصفحات، القوالب، القواعد، والجودة — متوافق مع إرشادات Google."
              : "Programmatic page generation, templates, rules, and quality — aligned with Google guidelines."}
          </p>
        </header>

        {/* Tabs */}
        <div className="mb-6 -mx-2 px-2 overflow-x-auto">
          <div className="inline-flex gap-1 rounded-2xl bg-slate-100/70 dark:bg-white/5 p-1 border border-slate-200/70 dark:border-white/10 whitespace-nowrap">
            {tabs.map((t) => (
              <NavLink
                key={t.to}
                to={t.to}
                end={t.end}
                className={({ isActive }) => cn(
                  "inline-flex items-center gap-2 h-9 px-3.5 rounded-xl text-[12.5px] font-semibold transition-all",
                  isActive
                    ? "bg-white dark:bg-slate-800 text-[#1E374B] dark:text-white shadow-[0_2px_8px_-4px_rgba(15,31,46,0.15)]"
                    : "text-slate-500 dark:text-slate-400 hover:text-[#1E374B] dark:hover:text-white"
                )}
              >
                <t.icon className="h-3.5 w-3.5" strokeWidth={1.8} />
                {t.label}
              </NavLink>
            ))}
          </div>
        </div>

        <Outlet />
      </div>
    </AdminLayout>
  );
};

export default AdminSeoLayout;
