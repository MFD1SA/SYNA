import React from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { FileText } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

/**
 * Admin Content — the previous "visual content / image upload" flow was
 * removed on admin request because it added no real workflow.
 * Page-level hero images are managed directly via the site-assets
 * storage bucket in Supabase.
 *
 * This page is kept as a placeholder so the /admincp/content route
 * continues to resolve cleanly until a real content workflow is introduced.
 */
const AdminContent: React.FC = () => {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  return (
    <AdminLayout>
      <div dir={isAr ? "rtl" : "ltr"}>
        <AdminPageHeader
          icon={FileText}
          titleAr="المحتوى"
          titleEn="Content"
          descAr="إدارة محتوى المنصة"
          descEn="Platform content management"
        />
        <div className="rounded-2xl border border-border/40 bg-card/60 dark:bg-white/[0.02] p-10 text-center">
          <FileText className="mx-auto mb-4 h-10 w-10 text-muted-foreground/50" strokeWidth={1.5} />
          <h3 className="text-[15px] font-semibold text-foreground mb-1">
            {isAr ? "قسم المحتوى" : "Content section"}
          </h3>
          <p className="text-[13px] text-muted-foreground max-w-md mx-auto leading-relaxed">
            {isAr
              ? "لا توجد أدوات إدارة محتوى نشطة حالياً. إدارة صور الهيدرات الخاصة بالصفحات تتم عبر تخزين site-assets في Supabase مباشرة."
              : "No active content management tools. Hero images for pages are managed directly via the site-assets storage bucket in Supabase."}
          </p>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminContent;
