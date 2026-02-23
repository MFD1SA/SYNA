import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import CrmLayout from "@/components/crm/CrmLayout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FileText, CheckCircle2, XCircle, Clock, Building2 } from "lucide-react";

const statusConfig: Record<string, { ar: string; en: string; color: string }> = {
  pending: { ar: "قيد المراجعة", en: "Pending", color: "bg-yellow-500/10 text-yellow-600" },
  approved: { ar: "مقبول", en: "Approved", color: "bg-green-500/10 text-green-600" },
  rejected: { ar: "مرفوض", en: "Rejected", color: "bg-destructive/10 text-destructive" },
  info_requested: { ar: "معلومات إضافية", en: "Info Requested", color: "bg-blue-500/10 text-blue-600" },
};

const CrmRequests: React.FC = () => {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const { toast } = useToast();
  const isAr = lang === "ar";
  usePageTitle(isAr ? "الطلبات الواردة" : "Requests");
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!user) return;
    // Owner sees requests on their lands
    const { data } = await supabase
      .from("deal_requests")
      .select("*, lands!inner(city, district, land_area_sqm, owner_id), developers(company_name, marketing_brand_name)")
      .eq("lands.owner_id", user.id)
      .order("created_at", { ascending: false });
    setRequests(data || []);
    setLoading(false);
  };

  useEffect(() => { if (user) fetchData(); }, [user]);

  const handleAction = async (requestId: string, action: "approved" | "rejected") => {
    const { error } = await supabase.from("deal_requests").update({ status: action }).eq("id", requestId);
    if (error) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: error.message });
    } else {
      toast({ title: action === "approved" ? (isAr ? "تم القبول" : "Approved") : (isAr ? "تم الرفض" : "Rejected") });
      fetchData();
    }
  };

  return (
    <CrmLayout>
      <div className="mb-5">
        <h1 className="text-2xl font-medium text-foreground">{isAr ? "طلبات الشراكة" : "Partnership Requests"}</h1>
        <p className="mt-1 text-sm font-light text-muted-foreground">
          {isAr ? "مراجعة طلبات المطورين على أراضيك والرد عليها" : "Review and respond to developer requests on your lands"}
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />)}
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <FileText className="mb-4 h-12 w-12 text-muted-foreground/30" strokeWidth={1} />
          <p className="text-sm font-light text-muted-foreground">{isAr ? "لا توجد طلبات شراكة حالياً" : "No partnership requests yet"}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => {
            const st = statusConfig[r.status] || statusConfig.pending;
            return (
              <div key={r.id} className="doma-card p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Building2 className="h-4 w-4 text-primary" strokeWidth={1.5} />
                      <span className="text-sm font-medium text-foreground">
                        {r.developers?.company_name || r.developers?.marketing_brand_name || (isAr ? "مطور" : "Developer")}
                      </span>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs ${st.color}`}>
                        {isAr ? st.ar : st.en}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs font-light text-muted-foreground ps-7">
                      <span>{isAr ? "الأرض:" : "Land:"} {r.lands?.city}{r.lands?.district ? ` - ${r.lands.district}` : ""}</span>
                      <span>{isAr ? "المساحة:" : "Area:"} {Number(r.lands?.land_area_sqm).toLocaleString()} {isAr ? "م²" : "sqm"}</span>
                      <span>{isAr ? "نوع المشروع:" : "Project Type:"} {r.proposed_project_type}</span>
                      <span>{isAr ? "العمولة:" : "Commission:"} {r.commission_rate}%</span>
                    </div>
                    {r.proposal_summary && (
                      <p className="mt-2 ps-7 text-xs font-light text-muted-foreground leading-relaxed">{r.proposal_summary}</p>
                    )}
                  </div>
                </div>
                {r.status === "pending" && (
                  <div className="mt-3 flex items-center gap-2 border-t border-border/40 pt-3 ps-7">
                    <Button size="sm" onClick={() => handleAction(r.id, "approved")} className="gap-1.5 bg-green-600 hover:bg-green-700 text-white">
                      <CheckCircle2 className="h-3.5 w-3.5" />{isAr ? "قبول" : "Approve"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleAction(r.id, "rejected")} className="gap-1.5 text-destructive border-destructive/30">
                      <XCircle className="h-3.5 w-3.5" />{isAr ? "رفض" : "Reject"}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </CrmLayout>
  );
};

export default CrmRequests;
