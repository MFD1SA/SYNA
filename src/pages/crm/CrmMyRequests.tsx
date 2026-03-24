import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import CrmLayout from "@/components/crm/CrmLayout";
import { Send, Clock, CheckCircle2, XCircle, AlertCircle, MapPin, Building2 } from "lucide-react";

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
  usePageTitle(isAr ? "طلباتي" : "My Requests");
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
        <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-start">
              <thead className="bg-muted/40 text-muted-foreground border-b border-border/60">
                <tr>
                  <th className="px-5 py-3.5 font-medium text-start text-xs tracking-wide">{isAr ? "الموقع والمساحة" : "Location & Area"}</th>
                  <th className="px-5 py-3.5 font-medium text-start text-xs tracking-wide">{isAr ? "تفاصيل المقترح" : "Proposal Details"}</th>
                  <th className="px-5 py-3.5 font-medium text-start text-xs tracking-wide">{isAr ? "التاريخ والحالة" : "Date & Status"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {requests.map((r) => {
                  const st = statusConfig[r.status] || statusConfig.pending;
                  const StatusIcon = st.icon;
                  return (
                    <tr key={r.id} className="hover:bg-muted/20 transition-colors group">
                      <td className="px-5 py-4 min-w-[200px] align-top">
                        <h3 className="text-sm font-medium text-foreground flex items-center gap-1.5 mb-1">
                          <MapPin className="h-3.5 w-3.5 text-primary" />
                          {r.lands?.city}{r.lands?.district ? ` - ${r.lands.district}` : ""}
                        </h3>
                        <p className="text-xs font-light text-muted-foreground ms-5">{Number(r.lands?.land_area_sqm).toLocaleString()} {isAr ? "م²" : "sqm"}</p>
                      </td>
                      <td className="px-5 py-4 min-w-[250px] align-top max-w-sm">
                        <div className="space-y-1.5 text-xs font-light text-muted-foreground">
                          <div className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5 text-primary" /> <span className="font-medium text-foreground">{r.proposed_project_type}</span></div>
                          {r.proposal_summary && <p className="line-clamp-2 leading-relaxed">{r.proposal_summary}</p>}
                          {r.owner_response_notes && (
                            <div className="rounded-md border border-border/40 bg-muted/30 p-2 mt-2 leading-relaxed text-yellow-600/80">
                              <span className="font-medium text-yellow-600 me-1">{isAr ? "ملاحظات الإدارة:" : "Admin notes:"}</span> {r.owner_response_notes}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] mb-2 ${st.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {isAr ? st.ar : st.en}
                        </span>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                          <Clock className="h-3 w-3" />
                          {new Date(r.created_at).toLocaleDateString(isAr ? "ar-SA" : "en-US", { year: "numeric", month: "short", day: "numeric" })}
                        </p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </CrmLayout>
  );
};

export default CrmMyRequests;
