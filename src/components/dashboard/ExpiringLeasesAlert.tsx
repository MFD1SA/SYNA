import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { AlertTriangle } from "lucide-react";

interface ExpiringLease {
  id: string;
  end_date: string;
  ejar_number: string | null;
  unit_id: string;
}

const ExpiringLeasesAlert: React.FC = () => {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const [leases, setLeases] = useState<ExpiringLease[]>([]);
  const isAr = lang === "ar";

  useEffect(() => {
    if (!user) return;
    const today = new Date();
    const in30Days = new Date(today);
    in30Days.setDate(today.getDate() + 30);

    const fetch = async () => {
      const { data } = await supabase
        .from("leases")
        .select("id, end_date, ejar_number, unit_id")
        .eq("status", "active")
        .lte("end_date", in30Days.toISOString().split("T")[0])
        .gte("end_date", today.toISOString().split("T")[0]);
      setLeases(data ?? []);
    };
    fetch();
  }, [user]);

  if (leases.length === 0) return null;

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900 dark:bg-amber-950/20">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="h-4 w-4 text-amber-600" strokeWidth={1.5} />
        <span className="text-sm font-medium text-amber-800 dark:text-amber-400">
          {isAr
            ? `${leases.length} عقد ينتهي خلال 30 يوم`
            : `${leases.length} lease(s) expiring within 30 days`}
        </span>
      </div>
      <div className="space-y-1">
        {leases.slice(0, 5).map((l) => (
          <p key={l.id} className="text-xs font-light text-amber-700 dark:text-amber-500">
            {isAr ? "ينتهي" : "Expires"}: {l.end_date}
            {l.ejar_number && ` — ${isAr ? "إيجار" : "Ejar"}: ${l.ejar_number}`}
          </p>
        ))}
        {leases.length > 5 && (
          <p className="text-xs font-light text-amber-600">
            {isAr ? `+${leases.length - 5} عقود أخرى` : `+${leases.length - 5} more`}
          </p>
        )}
      </div>
    </div>
  );
};

export default ExpiringLeasesAlert;
