import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePermissions } from "@/hooks/usePermissions";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ExpiringLeasesAlert from "@/components/dashboard/ExpiringLeasesAlert";
import ProjectsTab from "@/components/dashboard/ProjectsTab";
import UnitsTab from "@/components/dashboard/UnitsTab";
import LeasesTab from "@/components/dashboard/LeasesTab";
import { Building2, DoorOpen, FileText, TrendingUp, Shield } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Stats {
  projects: number;
  units: number;
  leases: number;
  activeLeases: number;
}

const DashboardOverview: React.FC = () => {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const { role } = usePermissions();
  const [stats, setStats] = useState<Stats>({ projects: 0, units: 0, leases: 0, activeLeases: 0 });
  const [loading, setLoading] = useState(true);
  const isAr = lang === "ar";

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      const [projectsRes, unitsRes, leasesRes, activeLeasesRes] = await Promise.all([
        supabase.from("projects").select("id", { count: "exact", head: true }),
        supabase.from("units").select("id", { count: "exact", head: true }),
        supabase.from("leases").select("id", { count: "exact", head: true }),
        supabase.from("leases").select("id", { count: "exact", head: true }).eq("status", "active"),
      ]);
      setStats({
        projects: projectsRes.count ?? 0,
        units: unitsRes.count ?? 0,
        leases: leasesRes.count ?? 0,
        activeLeases: activeLeasesRes.count ?? 0,
      });
      setLoading(false);
    };
    fetchStats();
  }, [user]);

  const roleLabel: Record<string, { ar: string; en: string }> = {
    admin: { ar: "مدير", en: "Admin" },
    user: { ar: "مستخدم", en: "User" },
    viewer: { ar: "مشاهد", en: "Viewer" },
  };

  const cards = [
    { label: isAr ? "المشاريع" : "Projects", value: stats.projects, icon: Building2 },
    { label: isAr ? "الوحدات" : "Units", value: stats.units, icon: DoorOpen },
    { label: isAr ? "العقود" : "Leases", value: stats.leases, icon: FileText },
    { label: isAr ? "العقود النشطة" : "Active Leases", value: stats.activeLeases, icon: TrendingUp },
  ];

  return (
    <DashboardLayout>
      {/* Header with role badge */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-foreground">{isAr ? "لوحة التحكم" : "Dashboard"}</h1>
          <p className="mt-1 text-sm font-light text-muted-foreground">
            {isAr ? "ملخص شامل لبياناتك" : "Comprehensive overview of your data"}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5">
          <Shield className="h-3.5 w-3.5 text-primary" strokeWidth={1.5} />
          <span className="text-xs font-light text-muted-foreground">
            {isAr ? roleLabel[role]?.ar : roleLabel[role]?.en}
          </span>
        </div>
      </div>

      {/* Expiring leases alert */}
      <ExpiringLeasesAlert />

      {/* Stats cards */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="doma-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-light text-muted-foreground">{card.label}</span>
              <card.icon className="h-5 w-5 text-primary" strokeWidth={1.5} />
            </div>
            <p className="text-2xl font-medium text-foreground" dir="ltr" style={{ fontVariantNumeric: "tabular-nums" }}>
              {loading ? <span className="inline-block h-7 w-14 animate-pulse rounded-lg bg-muted" /> : card.value.toLocaleString("en-US")}
            </p>
          </div>
        ))}
      </div>

      {/* Tabs for Projects / Units / Leases */}
      <Tabs defaultValue="projects" className="mt-6">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="projects" className="gap-1.5">
            <Building2 className="h-3.5 w-3.5" strokeWidth={1.5} />
            {isAr ? "المشاريع" : "Projects"}
          </TabsTrigger>
          <TabsTrigger value="units" className="gap-1.5">
            <DoorOpen className="h-3.5 w-3.5" strokeWidth={1.5} />
            {isAr ? "الوحدات" : "Units"}
          </TabsTrigger>
          <TabsTrigger value="leases" className="gap-1.5">
            <FileText className="h-3.5 w-3.5" strokeWidth={1.5} />
            {isAr ? "العقود" : "Leases"}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="projects" className="mt-4">
          <ProjectsTab />
        </TabsContent>
        <TabsContent value="units" className="mt-4">
          <UnitsTab />
        </TabsContent>
        <TabsContent value="leases" className="mt-4">
          <LeasesTab />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default DashboardOverview;
