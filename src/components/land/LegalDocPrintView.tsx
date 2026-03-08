import React, { useRef } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Printer, Download } from "lucide-react";
import LegalAcknowledgmentDoc from "./LegalAcknowledgmentDoc";
import { LandFormData } from "./LandFormConstants";

interface Props {
  open: boolean;
  onClose: () => void;
  form: LandFormData;
  referenceNumber?: string;
  ownerName?: string;
  companyName?: string;
}

const LegalDocPrintView: React.FC<Props> = ({ open, onClose, form, referenceNumber, ownerName, companyName }) => {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const printRef = useRef<HTMLDivElement>(null);

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
          .doc-header { text-align: center; margin-bottom: 24px; }
          .doc-header img { height: 48px; width: 48px; margin-bottom: 12px; }
          .doc-header h1 { font-size: 18px; font-weight: 600; }
          .doc-header p { font-size: 12px; color: #6b7280; margin-top: 4px; }
          .doc-separator { border: 0; border-top: 1px solid #e5e7eb; margin: 16px 0; }
          .doc-section { margin-bottom: 16px; }
          .doc-section h2 { font-size: 14px; font-weight: 600; margin-bottom: 8px; }
          .doc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px; }
          .doc-grid .label { color: #6b7280; }
          .doc-grid .value { font-weight: 500; }
          .doc-fees { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; margin: 12px 0; }
          .doc-fee-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 12px; }
          .doc-fee-total { font-weight: 600; border-top: 1px solid #e5e7eb; padding-top: 6px; margin-top: 6px; color: #0d9488; }
          .doc-legal { font-size: 11px; color: #6b7280; line-height: 1.6; }
          .doc-legal p { margin-bottom: 4px; }
          .doc-acceptance { border: 2px solid #0d948830; background: #0d94880a; border-radius: 8px; padding: 16px; margin: 16px 0; }
          .doc-acceptance h2 { font-size: 13px; font-weight: 600; margin-bottom: 8px; }
          .doc-acceptance p { font-size: 11px; color: #6b7280; line-height: 1.6; }
          .doc-sig { display: flex; gap: 24px; margin-top: 16px; }
          .doc-sig > div { flex: 1; border-bottom: 1px dashed #d1d5db; padding-bottom: 4px; }
          .doc-sig .sig-label { font-size: 10px; color: #9ca3af; }
          .doc-footer { text-align: center; font-size: 10px; color: #9ca3af; margin-top: 24px; }
          @media print { body { padding: 0; } .no-print { display: none !important; } }
        </style>
      </head>
      <body>
        ${content.innerHTML}
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-end gap-2 mb-2">
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
      </DialogContent>
    </Dialog>
  );
};

export default LegalDocPrintView;
