import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Building2, DoorOpen, FileText, TrendingUp } from "lucide-react";

interface Stats {
  projects: number;
  units: number;
  leases: number;
  activeLeases: number;
}

const DashboardOverview: React.FC = () => {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const [stats, setStats] = useState<Stats>({ projects: 0, units: 0, leases: 0, activeLeases: 0 });
  const [loading, setLoading] = useState(true);

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

  const cards = [
    {
      label: lang === "ar" ? "المشاريع" : "Projects",
      value: stats.projects,
      icon: Building2,
      gradient: "from-primary/10 to-primary/5",
    },
    {
      label: lang === "ar" ? "الوحدات" : "Units",
      value: stats.units,
      icon: DoorOpen,
      gradient: "from-accent/10 to-accent/5",
    },
    {
      label: lang === "ar" ? "العقود" : "Leases",
      value: stats.leases,
      icon: FileText,
      gradient: "from-primary/10 to-primary/5",
    },
    {
      label: lang === "ar" ? "العقود النشطة" : "Active Leases",
      value: stats.activeLeases,
      icon: TrendingUp,
      gradient: "from-primary/10 to-accent/5",
    },
  ];

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-medium text-foreground">
          {lang === "ar" ? "نظرة عامة" : "Overview"}
        </h1>
        <p className="mt-1 text-sm font-light text-muted-foreground">
          {lang === "ar" ? "ملخص سريع لبياناتك" : "A quick summary of your data"}
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="doma-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-light text-muted-foreground">{card.label}</span>
              <div className={`rounded-xl bg-gradient-to-br ${card.gradient} p-2.5`}>
                <card.icon className="h-4 w-4 text-primary" strokeWidth={1.5} />
              </div>
            </div>
            <p className="text-3xl font-medium text-foreground">
              {loading ? (
                <span className="inline-block h-8 w-16 animate-pulse rounded-lg bg-surface" />
              ) : (
                card.value
              )}
            </p>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default DashboardOverview;
