import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileCheck2, Link2, PartyPopper, ShieldCheck } from "lucide-react";

export interface DealDocumentItem {
  id: string;
  document_url: string;
  verified: boolean;
  created_at: string;
}

interface DealAutomationPanelProps {
  isAr: boolean;
  currentStage: string;
  driveUrl: string;
  validationNote: string;
  validatingLink: boolean;
  linkValidated: boolean;
  actionLoading: boolean;
  documents: DealDocumentItem[];
  onDriveUrlChange: (value: string) => void;
  onValidateLink: () => void;
  onSubmitLinkAndApprove: () => void;
  onCloseDeal: () => void;
}

const DealAutomationPanel: React.FC<DealAutomationPanelProps> = ({
  isAr,
  currentStage,
  driveUrl,
  validationNote,
  validatingLink,
  linkValidated,
  actionLoading,
  documents,
  onDriveUrlChange,
  onValidateLink,
  onSubmitLinkAndApprove,
  onCloseDeal,
}) => {
  const isDocsStage = currentStage === "documents_exchanged";
  const isAgreementStage = currentStage === "agreements_prepared";
  const isClosed = currentStage === "deal_closed";

  return (
    <div className="space-y-3">
      {documents.length > 0 && (
        <div className="rounded-lg border border-border/40 bg-muted/20 p-3 space-y-2">
          <h6 className="text-xs font-medium text-foreground flex items-center gap-1.5">
            <FileCheck2 className="h-3.5 w-3.5 text-primary" />
            {isAr ? "روابط المستندات" : "Document Links"}
          </h6>
          {documents.map((doc) => (
            <a
              key={doc.id}
              href={doc.document_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-md border border-border/40 bg-background px-2.5 py-2 text-xs hover:border-primary/40"
            >
              <span className="truncate flex items-center gap-1.5">
                <Link2 className="h-3 w-3 text-primary" />
                {doc.document_url}
              </span>
              <Badge variant="outline" className="text-[10px] shrink-0">
                {doc.verified ? (isAr ? "تم التحقق" : "Verified") : (isAr ? "بانتظار التحقق" : "Pending")}
              </Badge>
            </a>
          ))}
        </div>
      )}

      {isDocsStage && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-3">
          <h6 className="text-xs font-medium text-foreground flex items-center gap-1.5">
            <Link2 className="h-3.5 w-3.5 text-primary" />
            {isAr ? "إرفاق مستندات Google Drive" : "Attach Google Drive documents"}
          </h6>

          <Input
            value={driveUrl}
            onChange={(e) => onDriveUrlChange(e.target.value)}
            placeholder={isAr ? "الصق رابط Google Drive هنا" : "Paste Google Drive link here"}
            dir="ltr"
          />

          {validationNote && <p className="text-[11px] text-muted-foreground">{validationNote}</p>}

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onValidateLink} disabled={validatingLink || actionLoading}>
              {validatingLink ? (isAr ? "جارِ التحقق..." : "Validating...") : (isAr ? "تحقق من الرابط" : "Validate Link")}
            </Button>
            <Button
              type="button"
              size="sm"
              className="gap-1.5"
              onClick={onSubmitLinkAndApprove}
              disabled={!linkValidated || actionLoading}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              {actionLoading ? (isAr ? "جارِ الإرسال..." : "Submitting...") : (isAr ? "موافقة ومتابعة" : "Approve & Continue")}
            </Button>
          </div>
        </div>
      )}

      {isAgreementStage && (
        <div className="rounded-lg border border-border/40 bg-muted/10 p-3 space-y-2">
          <p className="text-xs text-muted-foreground">
            {isAr
              ? "تم استلام المستندات وبدء مرحلة الاتفاقيات."
              : "Documents confirmed and agreement stage is active."}
          </p>
          <Button type="button" size="sm" onClick={onCloseDeal} disabled={actionLoading}>
            {actionLoading ? (isAr ? "جارِ الإغلاق..." : "Closing...") : (isAr ? "إغلاق الصفقة" : "Close Deal")}
          </Button>
        </div>
      )}

      {isClosed && (
        <div className="rounded-lg border border-primary/30 bg-primary/10 p-3">
          <div className="flex items-center gap-2 mb-1">
            <PartyPopper className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium text-foreground">{isAr ? "مبروك 🎉" : "Congratulations 🎉"}</p>
          </div>
          <p className="text-xs text-muted-foreground">
            {isAr
              ? "اكتملت الصفقة بنجاح، وشكرًا لاستخدامك سينا."
              : "The deal has been closed successfully. Thank you for using the platform."}
          </p>
        </div>
      )}
    </div>
  );
};

export default DealAutomationPanel;
