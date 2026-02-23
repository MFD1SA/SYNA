import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import AdminLayout from "@/components/admin/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, FileText, Handshake, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

const AdminDeals: React.FC = () => {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  usePageTitle(isAr ? "إدارة الصفقات" : "Manage Deals");
  const [requests, setRequests] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchAll = async () => {
      const [reqRes, dealRes] = await Promise.all([
        supabase.from("deal_requests").select("*, lands(city, district, land_area_sqm), developers(company_name)").order("created_at", { ascending: false }),
        supabase.from("deals").select("*, lands(city, district), developers(company_name)").order("created_at", { ascending: false }),
      ]);
      setRequests(reqRes.data || []);
      setDeals(dealRes.data || []);
      setLoading(false);
    };
    fetchAll();
  }, []);

  const stageLabels: Record<string, { ar: string; en: string }> = {
    listed: { ar: "مُدرج", en: "Listed" },
    request_submitted: { ar: "طلب مقدم", en: "Submitted" },
    owner_review: { ar: "مراجعة المالك", en: "Owner Review" },
    owner_approved: { ar: "موافقة مبدئية", en: "Approved" },
    meeting_scheduled: { ar: "اجتماع مجدول", en: "Meeting" },
    strategy_defined: { ar: "استراتيجية", en: "Strategy" },
    documents_exchanged: { ar: "تبادل مستندات", en: "Documents" },
    agreements_prepared: { ar: "إعداد اتفاقيات", en: "Agreements" },
    deal_closed: { ar: "مُغلق", en: "Closed" },
    deal_cancelled: { ar: "ملغي", en: "Cancelled" },
  };

  const healthColors = { green: "bg-green-100 text-green-700", yellow: "bg-amber-100 text-amber-700", red: "bg-red-100 text-red-700" };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-foreground">{isAr ? "الطلبات والصفقات" : "Requests & Deals"}</h1>
        <p className="mt-1 text-sm font-light text-muted-foreground">{isAr ? "متابعة سير الطلبات والصفقات" : "Track request and deal workflows"}</p>
      </div>

      <Tabs defaultValue="requests">
        <TabsList className="mb-4">
          <TabsTrigger value="requests" className="gap-2"><FileText className="h-3.5 w-3.5" />{isAr ? "الطلبات" : "Requests"} ({requests.length})</TabsTrigger>
          <TabsTrigger value="deals" className="gap-2"><Handshake className="h-3.5 w-3.5" />{isAr ? "الصفقات" : "Deals"} ({deals.length})</TabsTrigger>
        </TabsList>

        <div className="mb-4 relative max-w-sm">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="ps-9" placeholder={isAr ? "بحث..." : "Search..."} value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <TabsContent value="requests">
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />)}</div>
          ) : (
            <div className="space-y-2">
              {requests.map(req => (
                <div key={req.id} className="doma-card flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {req.developers?.company_name || "—"} → {req.lands?.city}{req.lands?.district ? ` / ${req.lands?.district}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {req.proposed_project_type} • {req.lands?.land_area_sqm?.toLocaleString()} م²
                    </p>
                  </div>
                  <Badge variant={req.status === "approved" ? "default" : req.status === "rejected" ? "destructive" : "outline"}>
                    {req.status === "pending" && <Clock className="h-3 w-3 me-1" />}
                    {req.status === "approved" && <CheckCircle2 className="h-3 w-3 me-1" />}
                    {req.status === "rejected" && <XCircle className="h-3 w-3 me-1" />}
                    {isAr ? (req.status === "pending" ? "معلق" : req.status === "approved" ? "مقبول" : req.status === "rejected" ? "مرفوض" : "معلومات مطلوبة") : req.status}
                  </Badge>
                </div>
              ))}
              {requests.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">{isAr ? "لا توجد طلبات" : "No requests"}</p>}
            </div>
          )}
        </TabsContent>

        <TabsContent value="deals">
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />)}</div>
          ) : (
            <div className="space-y-2">
              {deals.map(deal => (
                <div key={deal.id} className="doma-card flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {deal.developers?.company_name || "—"} → {deal.lands?.city}{deal.lands?.district ? ` / ${deal.lands?.district}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isAr ? "العمولة:" : "Commission:"} {deal.commission_rate}%
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${healthColors[deal.health as keyof typeof healthColors]}`}>
                      {deal.health}
                    </span>
                    <Badge variant="outline">
                      {isAr ? stageLabels[deal.current_stage]?.ar : stageLabels[deal.current_stage]?.en}
                    </Badge>
                  </div>
                </div>
              ))}
              {deals.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">{isAr ? "لا توجد صفقات" : "No deals"}</p>}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
};

export default AdminDeals;
