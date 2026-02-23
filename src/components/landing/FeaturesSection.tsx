import React, { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { ShieldCheck, Eye, Handshake, Video, ArrowLeft, ArrowRight, X, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type FeatureKey = "verification" | "privacy" | "dealCrm" | "meetings";

const features: { key: FeatureKey; icon: typeof ShieldCheck }[] = [
  { key: "verification", icon: ShieldCheck },
  { key: "privacy", icon: Eye },
  { key: "dealCrm", icon: Handshake },
  { key: "meetings", icon: Video },
];

const detailedContent: Record<FeatureKey, { ar: { title: string; intro: string; points: string[] }; en: { title: string; intro: string; points: string[] } }> = {
  verification: {
    ar: {
      title: "تحقق تجاري موثوق",
      intro: "تحرص دوما على أن يكون كل مطور مسجّل في المنصة جهة موثوقة ومرخصة رسمياً، وذلك من خلال آلية تحقق دقيقة تشمل:",
      points: [
        "رفع السجل التجاري الرسمي عند التسجيل كمطور",
        "مطابقة بيانات السجل المُدخلة مع الوثيقة المرفوعة",
        "مراجعة وتدقيق من فريق دوما قبل تفعيل حساب المطور",
        "عرض حالة التحقق بوضوح (قيد المراجعة، موثق، مرفوض) داخل لوحة التحكم",
        "عدم إمكانية تقديم طلبات شراكة إلا بعد اكتمال التوثيق",
      ],
    },
    en: {
      title: "Verified Credentials",
      intro: "DOMA ensures every registered developer is a licensed and trustworthy entity through a precise verification process that includes:",
      points: [
        "Uploading the official commercial register during developer registration",
        "Matching entered register data with the uploaded document",
        "Review and audit by the DOMA team before activating the developer account",
        "Clear verification status display (Pending Review, Verified, Rejected) in the dashboard",
        "Partnership requests can only be submitted after verification is complete",
      ],
    },
  },
  privacy: {
    ar: {
      title: "خصوصية كاملة",
      intro: "تضع دوما خصوصية مالك الأرض في صدارة أولوياتها من خلال نظام حماية متدرج يضمن:",
      points: [
        "إخفاء البيانات الحساسة (رقم الصك، الموقع الدقيق، هوية المالك) عن المطورين",
        "عرض معلومات عامة فقط مثل المساحة والمدينة ونوع التطوير المطلوب",
        "كشف التفاصيل الكاملة فقط بعد موافقة المالك صراحةً على طلب الشراكة",
        "عدم إمكانية تجاوز مراحل الحماية أو الوصول للبيانات بطرق غير مصرح بها",
        "تسجيل كل عملية وصول في سجل آمن لضمان الشفافية والمساءلة",
      ],
    },
    en: {
      title: "Full Privacy",
      intro: "DOMA places landowner privacy at the forefront through a tiered protection system that ensures:",
      points: [
        "Sensitive data (deed number, exact location, owner identity) is hidden from developers",
        "Only general information such as area, city, and development type is displayed",
        "Full details are revealed only after the owner explicitly approves the partnership request",
        "Protection stages cannot be bypassed or data accessed through unauthorized means",
        "Every access operation is logged in a secure record for transparency and accountability",
      ],
    },
  },
  dealCrm: {
    ar: {
      title: "متابعة الصفقات",
      intro: "تمنحك دوما لوحة متابعة شاملة تغطي كل مرحلة من مراحل الشراكة التطويرية:",
      points: [
        "تتبع مراحل الصفقة من تقديم الطلب حتى إغلاق الاتفاق",
        "مؤشرات أداء مرئية توضح حالة كل صفقة (نشطة، متأخرة، مكتملة)",
        "تنبيهات آلية عند تأخر أي مرحلة عن الجدول الزمني المتوقع",
        "إمكانية إضافة مهام وملاحظات لكل صفقة لتنظيم العمل بين الأطراف",
        "سجل تاريخي كامل لجميع التحديثات والقرارات المتخذة في كل صفقة",
      ],
    },
    en: {
      title: "Deal Tracking",
      intro: "DOMA provides a comprehensive tracking dashboard covering every stage of the development partnership:",
      points: [
        "Track deal stages from request submission to agreement closure",
        "Visual performance indicators showing each deal's status (active, delayed, completed)",
        "Automated alerts when any stage falls behind the expected timeline",
        "Ability to add tasks and notes to each deal for organized collaboration",
        "Complete historical log of all updates and decisions made in each deal",
      ],
    },
  },
  meetings: {
    ar: {
      title: "اجتماعات مدمجة",
      intro: "تسهّل دوما التنسيق بين المالك والمطور من خلال نظام اجتماعات متكامل يشمل:",
      points: [
        "جدولة اجتماعات Google Meet تلقائياً فور موافقة المالك على طلب الشراكة",
        "إرسال دعوات تلقائية لكلا الطرفين مع تفاصيل الاجتماع",
        "ربط كل اجتماع بسجل الصفقة لسهولة المتابعة والرجوع",
        "دعم الاجتماعات الحضورية مع إمكانية تحديد الموقع والملاحظات",
        "حفظ سجل كامل بجميع المواعيد والروابط داخل صفحة الصفقة",
      ],
    },
    en: {
      title: "Integrated Meetings",
      intro: "DOMA facilitates coordination between owners and developers through an integrated meeting system that includes:",
      points: [
        "Automatic Google Meet scheduling upon owner approval of the partnership request",
        "Automatic invitations sent to both parties with meeting details",
        "Each meeting is linked to the deal record for easy tracking and reference",
        "Support for in-person meetings with location and notes specification",
        "Complete log of all appointments and links saved within the deal page",
      ],
    },
  },
};

const FeaturesSection: React.FC = () => {
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";
  const Arrow = isAr ? ArrowLeft : ArrowRight;
  const [openFeature, setOpenFeature] = useState<FeatureKey | null>(null);

  const detail = openFeature ? detailedContent[openFeature] : null;
  const content = detail ? (isAr ? detail.ar : detail.en) : null;

  return (
    <>
      <section id="features" className="relative py-6 md:py-8">
        <div className="container relative">
          <div className="mx-auto mb-8 max-w-2xl text-center">
            <h2 className="mb-2 text-3xl font-medium text-foreground md:text-4xl">
              {t.features.title}
            </h2>
            <p className="text-base font-light text-muted-foreground">
              {t.features.subtitle}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ key, icon: Icon }) => (
              <div
                key={key}
                className="group relative cursor-pointer overflow-hidden doma-card p-5"
                onClick={() => setOpenFeature(key)}
              >
                <div className="pointer-events-none absolute -end-8 -top-8 h-24 w-24 rounded-full bg-primary/[0.04] transition-all duration-300 group-hover:scale-150 group-hover:bg-primary/[0.06]" />
                <div className="relative">
                  <Icon className="mb-3 h-6 w-6 text-primary" strokeWidth={1.5} />
                  <h3 className="mb-1.5 text-base font-medium text-foreground">
                    {t.features[key]}
                  </h3>
                  <p className="mb-2 text-sm font-light leading-relaxed text-muted-foreground">
                    {t.features[`${key}Desc`]}
                  </p>
                  <div className="flex items-center gap-1 text-xs font-light text-primary opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <span>{isAr ? "اكتشف المزيد" : "Learn more"}</span>
                    <Arrow className="h-3 w-3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Dialog open={!!openFeature} onOpenChange={() => setOpenFeature(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl font-medium text-foreground">
              {openFeature && (() => {
                const Icon = features.find(f => f.key === openFeature)!.icon;
                return <Icon className="h-6 w-6 text-primary" strokeWidth={1.5} />;
              })()}
              {content?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm font-light leading-relaxed text-muted-foreground">
              {content?.intro}
            </p>
            <div className="space-y-2.5">
              {content?.points.map((point, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={1.5} />
                  <p className="text-sm font-light leading-relaxed text-foreground">{point}</p>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FeaturesSection;
