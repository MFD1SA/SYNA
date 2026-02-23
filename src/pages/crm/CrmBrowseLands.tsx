import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import CrmLayout from "@/components/crm/CrmLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Search, MapPin, Ruler, Send } from "lucide-react";

const usageLabels: Record<string, { ar: string; en: string }> = {
  residential: { ar: "سكني", en: "Residential" },
  commercial: { ar: "تجاري", en: "Commercial" },
  residential_commercial: { ar: "سكني تجاري", en: "Mixed Use" },
  high_density: { ar: "كثافة عالية", en: "High Density" },
};

const goalLabels: Record<string, { ar: string; en: string }> = {
  develop_sell: { ar: "تطوير وبيع", en: "Develop & Sell" },
  develop_rent: { ar: "تطوير وتأجير", en: "Develop & Rent" },
  develop_mixed: { ar: "تطوير مختلط", en: "Mixed" },
  develop_complex: { ar: "مجمع تطويري", en: "Complex" },
};

const CrmBrowseLands: React.FC = () => {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const { toast } = useToast();
  const isAr = lang === "ar";
  const [lands, setLands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [developerId, setDeveloperId] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [requestDialog, setRequestDialog] = useState<string | null>(null);
  const [requestForm, setRequestForm] = useState({ proposal_summary: "", proposed_project_type: "" });

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: dev } = await supabase.from("developers").select("id, verification_status").eq("user_id", user.id).maybeSingle();
      if (dev) {
        setDeveloperId(dev.id);
        setIsVerified(dev.verification_status === "verified");
      }
      const { data } = await supabase.from("lands").select("*").eq("is_active", true).order("created_at", { ascending: false });
      setLands(data || []);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const handleSubmitRequest = async () => {
    if (!developerId || !requestDialog || !requestForm.proposal_summary || !requestForm.proposed_project_type) {
      toast({ variant: "destructive", title: isAr ? "يرجى تعبئة جميع الحقول" : "Please fill all fields" });
      return;
    }
    const { error } = await supabase.from("deal_requests").insert({
      developer_id: developerId,
      land_id: requestDialog,
      proposal_summary: requestForm.proposal_summary,
      proposed_project_type: requestForm.proposed_project_type,
      commission_accepted: true,
      commission_rate: 2.5,
    });
    if (error) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: error.message });
    } else {
      toast({ title: isAr ? "تم إرسال الطلب بنجاح" : "Request submitted successfully" });
      setRequestDialog(null);
      setRequestForm({ proposal_summary: "", proposed_project_type: "" });
    }
  };

  return (
    <CrmLayout>
      <div className="mb-5">
        <h1 className="text-2xl font-medium text-foreground">{isAr ? "استعراض الأراضي" : "Browse Lands"}</h1>
        <p className="mt-1 text-sm font-light text-muted-foreground">
          {isAr ? "استعرض الأراضي المتاحة وقدم طلب شراكة" : "Browse available lands and submit partnership requests"}
        </p>
      </div>

      {!isVerified && developerId && (
        <div className="mb-4 rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4 text-sm font-light text-yellow-700">
          {isAr ? "حسابك قيد التحقق — يمكنك الاستعراض لكن لا يمكنك تقديم طلبات حتى يتم التحقق من سجلك التجاري" : "Your account is pending verification — you can browse but cannot submit requests until your commercial register is verified"}
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-40 animate-pulse rounded-xl bg-muted" />)}
        </div>
      ) : lands.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <Search className="mb-4 h-12 w-12 text-muted-foreground/30" strokeWidth={1} />
          <p className="text-sm font-light text-muted-foreground">{isAr ? "لا توجد أراضٍ متاحة حالياً" : "No lands available currently"}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lands.map((l) => (
            <div key={l.id} className="doma-card p-5">
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="h-4 w-4 text-primary" strokeWidth={1.5} />
                  <h3 className="font-medium text-foreground">{l.city}</h3>
                </div>
                {l.district && <p className="ps-6 text-sm font-light text-muted-foreground">{l.district}</p>}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-light text-muted-foreground mb-3">
                <span className="flex items-center gap-1">
                  <Ruler className="h-3 w-3" /> {Number(l.land_area_sqm).toLocaleString()} {isAr ? "م²" : "sqm"}
                </span>
                <span>{usageLabels[l.usage_type]?.[isAr ? "ar" : "en"] || l.usage_type}</span>
                <span>{goalLabels[l.partnership_goal]?.[isAr ? "ar" : "en"] || l.partnership_goal}</span>
                {l.street_width_m && <span>{isAr ? "شارع:" : "Street:"} {l.street_width_m}{isAr ? "م" : "m"}</span>}
              </div>
              {l.vision_summary && (
                <p className="mb-3 text-xs font-light text-muted-foreground line-clamp-2">{l.vision_summary}</p>
              )}
              <Button
                size="sm"
                className="w-full gap-1.5 doma-gradient"
                disabled={!isVerified}
                onClick={() => setRequestDialog(l.id)}
              >
                <Send className="h-3.5 w-3.5" />{isAr ? "تقديم طلب شراكة" : "Submit Partnership Request"}
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Request Dialog */}
      <Dialog open={!!requestDialog} onOpenChange={(o) => { if (!o) { setRequestDialog(null); setRequestForm({ proposal_summary: "", proposed_project_type: "" }); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isAr ? "تقديم طلب شراكة" : "Submit Partnership Request"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>{isAr ? "نوع المشروع المقترح" : "Proposed Project Type"}</Label>
              <Input value={requestForm.proposed_project_type} onChange={(e) => setRequestForm({ ...requestForm, proposed_project_type: e.target.value })} placeholder={isAr ? "مثال: مجمع تجاري" : "e.g., Commercial Complex"} />
            </div>
            <div className="space-y-2">
              <Label>{isAr ? "ملخص المقترح" : "Proposal Summary"}</Label>
              <Textarea value={requestForm.proposal_summary} onChange={(e) => setRequestForm({ ...requestForm, proposal_summary: e.target.value })} rows={4} placeholder={isAr ? "اكتب وصفاً واضحاً لمقترح التطوير..." : "Write a clear description of the development proposal..."} />
            </div>
            <div className="rounded-lg border border-border/40 bg-muted/30 p-3 text-xs font-light text-muted-foreground">
              {isAr ? "بتقديم هذا الطلب، أوافق على عمولة دوما بنسبة 2.50% عند إتمام الصفقة" : "By submitting this request, I agree to DOMA's 2.50% commission upon deal closure"}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRequestDialog(null)}>{isAr ? "إلغاء" : "Cancel"}</Button>
              <Button onClick={handleSubmitRequest} className="doma-gradient">{isAr ? "إرسال الطلب" : "Submit Request"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </CrmLayout>
  );
};

export default CrmBrowseLands;
