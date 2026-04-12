import React, { useRef, useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Printer, CheckCircle2, Loader2, Shield } from "lucide-react";
import LegalAcknowledgmentDoc from "./LegalAcknowledgmentDoc";
import { LandFormData } from "./LandFormConstants";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onClose: () => void;
  form: LandFormData;
  referenceNumber?: string;
  ownerName?: string;
  companyName?: string;
  /** Deal ID to save acknowledgment against */
  dealId?: string;
  /** "owner" | "developer" - who is viewing */
  viewerRole?: "owner" | "developer" | "admin";
  /** Already accepted? */
  ownerAcknowledged?: boolean;
  ownerAcknowledgedDate?: string | null;
  developerAcknowledged?: boolean;
  developerAcknowledgedDate?: string | null;
  /** Callback after successful acceptance */
  onAcknowledged?: () => void;
}

const LegalDocPrintView: React.FC<Props> = ({
  open, onClose, form, referenceNumber, ownerName, companyName,
  dealId, viewerRole, ownerAcknowledged, ownerAcknowledgedDate,
  developerAcknowledged, developerAcknowledgedDate, onAcknowledged,
}) => {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const printRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [accepting, setAccepting] = useState(false);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="${isAr ? "rtl" : "ltr"}">
      <head>
        <title>${isAr ? "وثيقة الإقرار القانوني" : "Legal Acknowledgment Document"}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #fff; color: #1a1a1a; padding: 20px; direction: ${isAr ? "rtl" : "ltr"}; }
          .doc-container { max-width: 700px; margin: 0 auto; }
          @media print { body { padding: 0; } .no-print { display: none !important; } }
        </style>
      </head>
      <body>${content.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
  };

  const handleAccept = async () => {
    if (!dealId || !viewerRole || viewerRole === "admin") return;
    setAccepting(true);
    try {
      const now = new Date().toISOString();
      const updates: Record<string, any> = viewerRole === "owner"
        ? { owner_acknowledgment_accepted: true, owner_acknowledgment_date: now }
        : { developer_acknowledgment_accepted: true, developer_acknowledgment_date: now };

      const { error } = await supabase.from("deals").update(updates).eq("id", dealId);
      if (error) throw error;
      toast({ title: isAr ? "تم حفظ الإقرار بنجاح" : "Acknowledgment saved successfully" });
      onAcknowledged?.();
    } catch (err: any) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: err.message });
    } finally {
      setAccepting(false);
    }
  };

  const alreadyAccepted = viewerRole === "owner" ? ownerAcknowledged : viewerRole === "developer" ? developerAcknowledged : false;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            {/* Acknowledgment status badges */}
            {dealId && (
              <div className="flex items-center gap-2 text-[10px]">
                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${ownerAcknowledged ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"}`}>
                  {ownerAcknowledged ? <CheckCircle2 className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
                  {isAr ? "إقرار المالك" : "Owner"}
                  {ownerAcknowledged && ownerAcknowledgedDate && ` • ${new Date(ownerAcknowledgedDate).toLocaleDateString(isAr ? "ar-SA" : "en-US")}`}
                </span>
                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${developerAcknowledged ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"}`}>
                  {developerAcknowledged ? <CheckCircle2 className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
                  {isAr ? "إقرار المطور" : "Developer"}
                  {developerAcknowledged && developerAcknowledgedDate && ` • ${new Date(developerAcknowledgedDate).toLocaleDateString(isAr ? "ar-SA" : "en-US")}`}
                </span>
              </div>
            )}
          </div>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handlePrint}>
            <Printer className="h-3.5 w-3.5" />
            {isAr ? "طباعة / PDF" : "Print / PDF"}
          </Button>
        </div>

        <div ref={printRef}>
          <LegalAcknowledgmentDoc
            form={form}
            referenceNumber={referenceNumber}
            ownerName={ownerName}
            companyName={companyName}
          />
        </div>

        {/* Accept button for owner/developer */}
        {dealId && viewerRole && viewerRole !== "admin" && (
          <div className="mt-4 border-t border-border/40 pt-4">
            {alreadyAccepted ? (
              <div className="flex items-center justify-center gap-2 text-emerald-600 bg-emerald-500/10 rounded-lg p-3">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {isAr ? "تم قبول الإقرار القانوني" : "Legal acknowledgment accepted"}
                </span>
              </div>
            ) : (
              <Button
                className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
                onClick={handleAccept}
                disabled={accepting}
              >
                {accepting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {isAr
                  ? "أوافق على الإقرار القانوني وأقبل الشروط"
                  : "I accept the legal acknowledgment and agree to the terms"}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LegalDocPrintView;
