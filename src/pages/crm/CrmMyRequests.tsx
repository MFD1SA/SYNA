import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import CrmLayout from "@/components/crm/CrmLayout";
import { Send, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

const statusConfig: Record<string, { ar: string; en: string; color: string; icon: React.ElementType }> = {
  pending: { ar: "قيد المراجعة", en: "Pending", color: "bg-yellow-500/10 text-yellow-600", icon: Clock },
  approved: { ar: "مقبول", en: "Approved", color: "bg-green-500/10 text-green-600", icon: CheckCircle2 },
  rejected: { ar: "مرفوض", en: "Rejected", color: "bg-destructive/10 text-destructive", icon: XCircle },
  info_requested: { ar: "معلومات إضافية", en: "Info Requested", color: "bg-blue-500/10 text-blue-600", icon: AlertCircle },
};

const CrmMyRequests: React.FC = () => {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: dev } = await supabase.from("developers").select("id").eq("user_id", user.id).maybeSingle();
      if (!dev) { setLoading(false); return; }
      const { data } = await supabase
        .from("deal_requests")
        .select("*, lands(city, district, land_area_sqm)")
        .eq("developer_id", dev.id)
        .order("created_at", { ascending: false });
      setRequests(data || []);
      setLoading(false);
    };
    fetch();
  }, [user]);

  return (
    <CrmLayout>
      <div className="mb-5">
        <h1 className="text-2xl font-medium text-foreground">{isAr ? "طلباتي" : "My Requests"}</h1>
        <p className="mt-1 text-sm font-light text-muted-foreground">
          {isAr ? "متابعة حالة طلبات الشراكة المقدمة" : "Track the status of your submitted partnership requests"}
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />)}
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <Send className="mb-4 h-12 w-12 text-muted-foreground/30" strokeWidth={1} />
          <p className="text-sm font-light text-muted-foreground">{isAr ? "لم تقدم أي طلبات شراكة بعد" : "You haven't submitted any requests yet"}</p>
          <p className="mt-1 text-xs font-light text-muted-foreground">{isAr ? "استعرض الأراضي المتاحة لتقديم طلبك الأول" : "Browse available lands to submit your first request"}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => {
            const st = statusConfig[r.status] || statusConfig.pending;
            const StatusIcon = st.icon;
            return (
              <div key={r.id} className="doma-card p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-foreground mb-1">
                      {r.lands?.city}{r.lands?.district ? ` - ${r.lands.district}` : ""}
                    </h3>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs font-light text-muted-foreground">
                      <span>{isAr ? "المساحة:" : "Area:"} {Number(r.lands?.land_area_sqm).toLocaleString()} {isAr ? "م²" : "sqm"}</span>
                      <span>{isAr ? "نوع المشروع:" : "Type:"} {r.proposed_project_type}</span>
                      <span>{isAr ? "العمولة:" : "Commission:"} {r.commission_rate}%</span>
                      <span>{isAr ? "التاريخ:" : "Date:"} {new Date(r.created_at).toLocaleDateString(isAr ? "ar-SA" : "en-US")}</span>
                    </div>
                    {r.proposal_summary && (
                      <p className="mt-2 text-xs font-light text-muted-foreground line-clamp-2">{r.proposal_summary}</p>
                    )}
                    {r.owner_response_notes && (
                      <div className="mt-2 rounded-lg border border-border/40 bg-muted/30 p-2 text-xs font-light text-muted-foreground">
                        <span className="font-medium">{isAr ? "ملاحظات المالك:" : "Owner notes:"}</span> {r.owner_response_notes}
                      </div>
                    )}
                  </div>
                  <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs ${st.color}`}>
                    <StatusIcon className="h-3 w-3" />
                    {isAr ? st.ar : st.en}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </CrmLayout>
  );
};

export default CrmMyRequests;
