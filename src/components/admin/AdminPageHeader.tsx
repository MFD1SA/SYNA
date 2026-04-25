import React from "react";
import PageHeader from "@/components/dashboard/PageHeader";

/**
 * AdminPageHeader — kept as a thin wrapper around the unified
 * `PageHeader` component so existing admin pages (AdminLands,
 * AdminOwners, AdminDevelopers, AdminDeals, …) get the visual upgrade
 * automatically without any import or prop changes.
 *
 * For new pages, prefer importing `PageHeader` directly so you can pick
 * the matching variant (admin / owner / developer).
 */
interface AdminPageHeaderProps {
  icon: React.ElementType;
  titleAr: string;
  titleEn: string;
  descAr?: string;
  descEn?: string;
  actions?: React.ReactNode;
}

const AdminPageHeader: React.FC<AdminPageHeaderProps> = ({
  icon,
  titleAr,
  titleEn,
  descAr,
  descEn,
  actions,
}) => {
  return (
    <PageHeader
      // Cast: legacy callers passed `React.ElementType`; PageHeader uses
      // the narrower `LucideIcon`. All real call sites use lucide icons.
      icon={icon as never}
      titleAr={titleAr}
      titleEn={titleEn}
      descAr={descAr}
      descEn={descEn}
      variant="admin"
      actions={actions}
    />
  );
};

export default AdminPageHeader;
