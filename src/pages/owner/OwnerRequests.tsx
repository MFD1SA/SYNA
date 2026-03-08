import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import OwnerLayout from "@/components/owner/OwnerLayout";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock, CheckCircle2, XCircle, AlertCircle, Building2, MapPin } from "lucide-react";

const statusConfig: Record<string, { ar: string; en: string; color: string; icon: React.ElementType }> = {
  pending: { ar: "قيد المراجعة", en: "Pending", color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20", icon: Clock },
  approved: { ar: "مقبول", en: "Approved", color: "bg-green-500/10 text-green-600 border-green-500/20", icon: CheckCircle2 },
  rejected: { ar: "مرفوض", en: "Rejected", color: "bg-destructive/10 text-destructive border-destructive/20", icon: XCircle },
  info_requested: { ar: "معلومات إضافية", en: "Info Requested", color: "bg-blue-500/10 text-blue-600 border-blue-500/20", icon: AlertCircle },
};

const OwnerRequests: React.FC = () => {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  usePageTitle(isAr ? "طلبات الشراكة" : "Partnership Requests");
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: lands } = await supabase.from("lands").select("id").eq("owner_id", user.id);
      if (!lands || lands.length === 0) { setLoading(false); return; }
      const landIds = lands.map(l => l.id);
      const { data } = await supabase
        .from("deal_requests")
        .select("*, developers(company_name, marketing_brand_name, email), lands(city, district)")
        .in("land_id", landIds)
        .order("created_at", { ascending: false });
      setRequests(data || []);
      setLoading(false);
    };
    fetch();
  }, [user]);

  return (
    <OwnerLayout>
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1">
          <FileText className="h-5 w-5 text-primary" strokeWidth={1.5} />
          <h1 className="text-2xl font-medium text-foreground">{isAr ? "طلبات الشراكة" : "Partnership Requests"}</h1>
        </div>
        <p className="text-sm font-light text-muted-foreground">{isAr ? "متابعة طلبات المطورين على أراضيك" : "Track developer requests on your lands"}</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />)}
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileText className="h-12 w-12 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">{isAr ? "لا توجد طلبات شراكة حالياً" : "No partnership requests yet"}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const sc = statusConfig[req.status] || statusConfig.pending;
            const StatusIcon = sc.icon;
            return (
              <div key={req.id} className="rounded-xl border border-border/60 bg-card p-4 transition-all hover:border-primary/20">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 className="h-4 w-4 text-primary shrink-0" strokeWidth={1.5} />
                      <span className="text-sm font-medium text-foreground truncate">
                        {req.developers?.marketing_brand_name || req.developers?.company_name || (isAr ? "مطور" : "Developer")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span>{req.lands?.city}{req.lands?.district ? ` - ${req.lands.district}` : ""}</span>
                    </div>
                    <p className="text-xs font-light text-muted-foreground line-clamp-2">{req.proposal_summary}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground/60" dir="ltr">
                      {new Date(req.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                    </p>
                  </div>
                  <Badge variant="outline" className={`shrink-0 gap-1 ${sc.color}`}>
                    <StatusIcon className="h-3 w-3" />
                    {isAr ? sc.ar : sc.en}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </OwnerLayout>
  );
};

export default OwnerRequests;
