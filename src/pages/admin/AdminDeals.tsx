import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import AdminLayout from "@/components/admin/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Search, FileText, Handshake, Clock, CheckCircle2, XCircle, AlertCircle, Eye, Ruler, MapPin } from "lucide-react";

const AdminDeals: React.FC = () => {
  const { lang } = useLanguage();
  const { toast } = useToast();
  const isAr = lang === "ar";
  usePageTitle(isAr ? "إدارة الصفقات" : "Manage Deals");
  const [requests, setRequests] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewReq, setViewReq] = useState<any>(null);
  const [rejectNotes, setRejectNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAll = async () => {
    const [reqRes, dealRes] = await Promise.all([
      supabase.from("deal_requests").select("*, lands(city, district, land_area_sqm, usage_type, partnership_goal, owner_name), developers(company_name, marketing_brand_name, cr_number, email, phone)").order("created_at", { ascending: false }),
      supabase.from("deals").select("*, lands(city, district), developers(company_name)").order("created_at", { ascending: false }),
    ]);
    setRequests(reqRes.data || []);
    setDeals(dealRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleApprove = async (req: any) => {
    setActionLoading(true);
    // Update request status
    const { error: updateErr } = await supabase.from("deal_requests").update({ status: "approved" }).eq("id", req.id);
    if (updateErr) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: updateErr.message });
      setActionLoading(false);
      return;
    }
    // Create a deal
    const { error: dealErr } = await supabase.from("deals").insert({
      request_id: req.id,
      land_id: req.land_id,
      developer_id: req.developer_id,
      owner_id: req.lands?.owner_id || (await supabase.from("lands").select("owner_id").eq("id", req.land_id).single()).data?.owner_id,
      commission_rate: req.commission_rate,
    });
    if (dealErr) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: dealErr.message });
    } else {
      toast({ title: isAr ? "تمت الموافقة وإنشاء الصفقة" : "Approved and deal created" });
    }
    setViewReq(null);
    setActionLoading(false);
    fetchAll();
  };

  const handleReject = async (req: any) => {
    setActionLoading(true);
    const { error } = await supabase.from("deal_requests").update({
      status: "rejected",
      owner_response_notes: rejectNotes || null,
    }).eq("id", req.id);
    if (error) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: error.message });
    } else {
      toast({ title: isAr ? "تم رفض الطلب" : "Request rejected" });
    }
    setViewReq(null);
    setRejectNotes("");
    setActionLoading(false);
    fetchAll();
  };

  const stageLabels: Record<string, { ar: string; en: string }> = {
    listed: { ar: "مُدرج", en: "Listed" },
    request_submitted: { ar: "طلب مقدم", en: "Submitted" },
    owner_review: { ar: "مراجعة الإدارة", en: "Admin Review" },
    owner_approved: { ar: "موافقة مبدئية", en: "Approved" },
    meeting_scheduled: { ar: "اجتماع مجدول", en: "Meeting" },
    strategy_defined: { ar: "استراتيجية", en: "Strategy" },
    documents_exchanged: { ar: "تبادل مستندات", en: "Documents" },
    agreements_prepared: { ar: "إعداد اتفاقيات", en: "Agreements" },
    deal_closed: { ar: "مُغلق", en: "Closed" },
    deal_cancelled: { ar: "ملغي", en: "Cancelled" },
  };

  const statusLabels: Record<string, { ar: string; en: string }> = {
    pending: { ar: "معلق", en: "Pending" },
    approved: { ar: "مقبول", en: "Approved" },
    rejected: { ar: "مرفوض", en: "Rejected" },
    info_requested: { ar: "معلومات مطلوبة", en: "Info Requested" },
  };

  const healthColors = { green: "bg-green-100 text-green-700", yellow: "bg-amber-100 text-amber-700", red: "bg-red-100 text-red-700" };

  const filteredRequests = requests.filter(r =>
    r.developers?.company_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.lands?.city?.toLowerCase().includes(search.toLowerCase()) ||
    r.proposed_project_type?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredDeals = deals.filter(d =>
    d.developers?.company_name?.toLowerCase().includes(search.toLowerCase()) ||
    d.lands?.city?.toLowerCase().includes(search.toLowerCase())
  );

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
              {filteredRequests.map(req => (
                <div key={req.id} className="doma-card flex items-center justify-between p-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {req.developers?.company_name || "—"} → {req.lands?.city}{req.lands?.district ? ` / ${req.lands?.district}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {req.proposed_project_type} • {Number(req.lands?.land_area_sqm).toLocaleString()} {isAr ? "م²" : "sqm"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={req.status === "approved" ? "default" : req.status === "rejected" ? "destructive" : "outline"}>
                      {req.status === "pending" && <Clock className="h-3 w-3 me-1" />}
                      {req.status === "approved" && <CheckCircle2 className="h-3 w-3 me-1" />}
                      {req.status === "rejected" && <XCircle className="h-3 w-3 me-1" />}
                      {isAr ? statusLabels[req.status]?.ar : statusLabels[req.status]?.en}
                    </Badge>
                    <Button size="sm" variant="outline" onClick={() => { setViewReq(req); setRejectNotes(""); }}>
                      <Eye className="h-3.5 w-3.5 me-1" />{isAr ? "عرض" : "View"}
                    </Button>
                  </div>
                </div>
              ))}
              {filteredRequests.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">{isAr ? "لا توجد طلبات" : "No requests"}</p>}
            </div>
          )}
        </TabsContent>

        <TabsContent value="deals">
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />)}</div>
          ) : (
            <div className="space-y-2">
              {filteredDeals.map(deal => (
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
              {filteredDeals.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">{isAr ? "لا توجد صفقات" : "No deals"}</p>}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* View Request Dialog */}
      <Dialog open={!!viewReq} onOpenChange={(o) => { if (!o) setViewReq(null); }}>
        <DialogContent className="max-w-lg" dir={isAr ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle>{isAr ? "تفاصيل الطلب" : "Request Details"}</DialogTitle>
          </DialogHeader>
          {viewReq && (
            <div className="space-y-4">
              {/* Developer Info */}
              <div className="rounded-lg border border-border/40 bg-muted/30 p-3 space-y-1">
                <p className="text-xs font-medium text-muted-foreground">{isAr ? "المطور" : "Developer"}</p>
                <p className="text-sm font-medium text-foreground">{viewReq.developers?.company_name}</p>
                {viewReq.developers?.marketing_brand_name && (
                  <p className="text-xs text-muted-foreground">{isAr ? "الاسم التجاري:" : "Brand:"} {viewReq.developers.marketing_brand_name}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {isAr ? "سجل تجاري:" : "CR:"} {viewReq.developers?.cr_number} • {viewReq.developers?.email || "—"} • {viewReq.developers?.phone || "—"}
                </p>
              </div>

              {/* Land Info */}
              <div className="rounded-lg border border-border/40 bg-muted/30 p-3 space-y-1">
                <p className="text-xs font-medium text-muted-foreground">{isAr ? "الأرض" : "Land"}</p>
                <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  {viewReq.lands?.city}{viewReq.lands?.district ? ` - ${viewReq.lands.district}` : ""}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Ruler className="h-3 w-3" /> {Number(viewReq.lands?.land_area_sqm).toLocaleString()} {isAr ? "م²" : "sqm"}
                </p>
              </div>

              {/* Proposal */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">{isAr ? "نوع المشروع المقترح" : "Proposed Project Type"}</Label>
                <p className="text-sm text-foreground bg-muted/30 rounded-lg p-3 border border-border/40">{viewReq.proposed_project_type}</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">{isAr ? "ملخص المقترح" : "Proposal Summary"}</Label>
                <p className="text-sm text-foreground bg-muted/30 rounded-lg p-3 border border-border/40 whitespace-pre-wrap">{viewReq.proposal_summary}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-lg border border-border/40 bg-muted/30 p-2 text-center">
                  <p className="text-muted-foreground">{isAr ? "نسبة العمولة" : "Commission"}</p>
                  <p className="font-medium text-foreground">{viewReq.commission_rate}%</p>
                </div>
                <div className="rounded-lg border border-border/40 bg-muted/30 p-2 text-center">
                  <p className="text-muted-foreground">{isAr ? "التمويل" : "Financing"}</p>
                  <p className="font-medium text-foreground">{viewReq.needs_financing ? (isAr ? "مطلوب" : "Required") : (isAr ? "غير مطلوب" : "Not Required")}</p>
                </div>
              </div>

              {/* Reject notes */}
              {viewReq.status === "pending" && (
                <div className="space-y-1.5">
                  <Label className="text-xs">{isAr ? "ملاحظات (في حال الرفض)" : "Notes (if rejecting)"}</Label>
                  <Textarea value={rejectNotes} onChange={e => setRejectNotes(e.target.value)} rows={2} placeholder={isAr ? "سبب الرفض..." : "Rejection reason..."} />
                </div>
              )}

              {viewReq.owner_response_notes && viewReq.status !== "pending" && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">{isAr ? "ملاحظات الإدارة" : "Admin Notes"}</Label>
                  <p className="text-sm text-foreground bg-muted/30 rounded-lg p-3 border border-border/40">{viewReq.owner_response_notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setViewReq(null)}>{isAr ? "إغلاق" : "Close"}</Button>
            {viewReq?.status === "pending" && (
              <>
                <Button variant="destructive" onClick={() => handleReject(viewReq)} disabled={actionLoading}>
                  <XCircle className="h-3.5 w-3.5 me-1" />{isAr ? "رفض" : "Reject"}
                </Button>
                <Button onClick={() => handleApprove(viewReq)} disabled={actionLoading} className="doma-gradient">
                  <CheckCircle2 className="h-3.5 w-3.5 me-1" />{isAr ? "قبول" : "Approve"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminDeals;
