import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  Landmark, MapPin, Eye, Globe, LogOut, CheckCircle2,
  Radar, Users, Brain, TrendingUp, Shield, FileText,
  ThumbsUp, ThumbsDown, AlertTriangle, ChevronDown, ChevronUp,
  Loader2, BarChart3
} from "lucide-react";
import logoImg from "@/assets/logo.png";
import DevWebsiteAnalysis from "@/components/owner/DevWebsiteAnalysis";

const statusLabels: Record<string, { ar: string; en: string; color: string }> = {
  active_approved: { ar: "نشطة - مالك موافق", en: "Active - Owner Approved", color: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20" },
  active: { ar: "نشطة", en: "Active", color: "bg-blue-500/10 text-blue-700 border-blue-500/20" },
  pending: { ar: "قيد المراجعة", en: "Under Review", color: "bg-amber-500/10 text-amber-700 border-amber-500/20" },
  draft: { ar: "مسودة", en: "Draft", color: "bg-muted text-muted-foreground border-border" },
};

const recLabels: Record<string, { ar: string; en: string; color: string; icon: React.ElementType }> = {
  accept: { ar: "يُوصى بالقبول", en: "Recommended", color: "text-emerald-700 bg-emerald-500/10 border-emerald-500/20", icon: ThumbsUp },
  cautious: { ar: "يُنصح بالتريث", en: "Proceed with Caution", color: "text-amber-700 bg-amber-500/10 border-amber-500/20", icon: AlertTriangle },
  reject: { ar: "يُوصى بالرفض", en: "Not Recommended", color: "text-red-700 bg-red-500/10 border-red-500/20", icon: ThumbsDown },
};

interface DeveloperAnalysis {
  request_id: string;
  developer_id: string;
  developer_name: string;
  developer_brand?: string;
  verification_status: string;
  proposed_project_type: string;
  proposal_summary: string;
  commission_rate: number;
  estimated_duration_months?: number;
  needs_financing: boolean;
  status: string;
  created_at: string;
  stats: {
    total_requests: number;
    approved_requests: number;
    rejected_requests: number;
    active_deals: number;
    closed_deals: number;
    cancelled_deals: number;
    health_ratio: number;
  };
  ai_analysis: {
    overall_score: number;
    profile_score: number;
    track_record_score: number;
    proposal_score: number;
    reliability_score: number;
    recommendation: string;
    recommendation_reason_ar: string;
    strengths_ar: string[];
    weaknesses_ar: string[];
    negotiation_tips_ar?: string[];
    summary_ar: string;
  };
  error?: boolean;
}

const ScoreBar = ({ label, score, max, color }: { label: string; score: number; max: number; color: string }) => (
  <div className="space-y-1">
    <div className="flex items-center justify-between text-xs">
      <span className="font-light text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{score}/{max}</span>
    </div>
    <div className="h-2 w-full rounded-full bg-muted">
      <div className={`h-2 rounded-full ${color} transition-all duration-700`} style={{ width: `${(score / max) * 100}%` }} />
    </div>
  </div>
);

const OwnerDashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const { lang, toggleLang } = useLanguage();
  const { toast } = useToast();
  const isAr = lang === "ar";
  usePageTitle(isAr ? "لوحة المالك" : "Owner Dashboard");
  const navigate = useNavigate();

  const [lands, setLands] = useState<any[]>([]);
  const [requests, setRequests] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [pulseSnapshots, setPulseSnapshots] = useState<Record<string, any>>({});
  const [expandedLand, setExpandedLand] = useState<string | null>(null);
  const [analyses, setAnalyses] = useState<Record<string, DeveloperAnalysis[]>>({});
  const [analyzingLand, setAnalyzingLand] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data: landsData } = await supabase
        .from("lands")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      setLands(landsData || []);

      if (landsData && landsData.length > 0) {
        const landIds = landsData.map(l => l.id);
        const { data: reqData } = await supabase
          .from("deal_requests")
          .select("land_id")
          .in("land_id", landIds);

        const counts: Record<string, number> = {};
        reqData?.forEach(r => { counts[r.land_id] = (counts[r.land_id] || 0) + 1; });
        setRequests(counts);

        const { data: pulseData } = await supabase
          .from("land_pulse_snapshots")
          .select("*")
          .in("land_id", landIds)
          .order("created_at", { ascending: false });

        const snapMap: Record<string, any> = {};
        pulseData?.forEach(s => { if (!snapMap[s.land_id]) snapMap[s.land_id] = s; });
        setPulseSnapshots(snapMap);
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const getLandStatus = (land: any) => {
    if (land.is_active && land.owner_approved) return "active_approved";
    if (land.is_active) return "active";
    return "draft";
  };

  const analyzeDevs = async (landId: string) => {
    if (analyses[landId]) {
      setExpandedLand(expandedLand === landId ? null : landId);
      return;
    }

    setAnalyzingLand(landId);
    setExpandedLand(landId);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-developer", {
        body: { land_id: landId },
      });

      if (error) throw error;
      setAnalyses(prev => ({ ...prev, [landId]: data.analyses || [] }));
    } catch (e: any) {
      console.error(e);
      toast({ variant: "destructive", title: isAr ? "خطأ في التحليل" : "Analysis Error", description: e.message });
    } finally {
      setAnalyzingLand(null);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return "bg-emerald-500";
    if (score >= 50) return "bg-amber-500";
    return "bg-red-500";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return { ar: "ممتاز", en: "Excellent" };
    if (score >= 65) return { ar: "جيد جداً", en: "Very Good" };
    if (score >= 50) return { ar: "جيد", en: "Good" };
    if (score >= 35) return { ar: "مقبول", en: "Fair" };
    return { ar: "ضعيف", en: "Weak" };
  };

  return (
    <div className="flex min-h-screen bg-background" dir={isAr ? "rtl" : "ltr"}>
      {/* Sidebar */}
      <aside className="sticky top-0 flex h-screen w-60 flex-col border-e border-border/60 bg-card">
        <div className="flex h-14 items-center gap-2 border-b border-border/60 px-4">
          <img src={logoImg} alt="DOMA" className="h-6 w-6 rounded-lg object-contain" />
          <span className="text-base font-medium text-foreground">DOMA</span>
        </div>
        <div className="mx-3 mt-3 mb-1 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-1.5">
          <Landmark className="h-3.5 w-3.5 text-primary" strokeWidth={1.5} />
          <span className="text-xs font-medium text-primary">{isAr ? "مالك أرض" : "Land Owner"}</span>
        </div>
        <nav className="flex-1 p-3">
          <div className="flex items-center gap-3 rounded-xl bg-primary/10 px-3 py-2 text-sm text-primary">
            <Landmark className="h-4 w-4" strokeWidth={1.5} />
            <span className="font-light">{isAr ? "أراضيي" : "My Lands"}</span>
          </div>
        </nav>
        <div className="space-y-0.5 border-t border-border/60 p-3">
          <p className="truncate px-3 py-1 text-xs font-light text-muted-foreground">{user?.email}</p>
          <button onClick={toggleLang} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-light text-muted-foreground transition-colors hover:bg-muted/50">
            <Globe className="h-4 w-4 shrink-0" strokeWidth={1.5} />
            {isAr ? "English" : "العربية"}
          </button>
          <button onClick={async () => { await signOut(); navigate("/"); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-light text-destructive transition-colors hover:bg-destructive/5">
            <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.5} />
            {isAr ? "خروج" : "Logout"}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-medium text-foreground">{isAr ? "أراضيي" : "My Lands"}</h1>
          <p className="mt-1 text-sm font-light text-muted-foreground">
            {isAr ? "تابع حالة أراضيك واستعرض تحليلات المطورين المهتمين بالذكاء الاصطناعي" : "Track your lands and review AI-powered developer analyses"}
          </p>
        </div>

        {loading ? (
          <div className="grid gap-4">
            {[1, 2].map(i => <div key={i} className="h-48 animate-pulse rounded-xl bg-muted" />)}
          </div>
        ) : lands.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Landmark className="mb-4 h-12 w-12 text-muted-foreground/30" strokeWidth={1} />
            <p className="text-sm font-light text-muted-foreground">
              {isAr ? "لا توجد أراضي — تواصل مع مدير النظام" : "No lands — contact admin"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {lands.map(land => {
              const status = getLandStatus(land);
              const statusInfo = statusLabels[status] || statusLabels.draft;
              const reqCount = requests[land.id] || 0;
              const pulse = pulseSnapshots[land.id];
              const isExpanded = expandedLand === land.id;
              const landAnalyses = analyses[land.id] || [];
              const isAnalyzing = analyzingLand === land.id;

              return (
                <div key={land.id} className="doma-card overflow-hidden">
                  {/* Land header */}
                  <div className="p-5">
                    <div className="mb-3 flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" strokeWidth={1.5} />
                        <h3 className="font-medium text-foreground">{land.city}</h3>
                        {land.district && <span className="text-sm font-light text-muted-foreground">— {land.district}</span>}
                      </div>
                      <Badge variant="outline" className={`text-[10px] ${statusInfo.color}`}>
                        {isAr ? statusInfo.ar : statusInfo.en}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs font-light text-muted-foreground mb-4">
                      <span>{Number(land.land_area_sqm).toLocaleString()} {isAr ? "م²" : "sqm"}</span>
                      {land.street_width_m && <span>{isAr ? "شارع:" : "Street:"} {land.street_width_m}{isAr ? "م" : "m"}</span>}
                      {land.partnership_model && <span>{isAr ? "نموذج:" : "Model:"} {land.partnership_model}</span>}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {land.owner_approved && (
                        <div className="flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="text-xs font-light text-emerald-700">{isAr ? "مالك موافق" : "Owner Approved"}</span>
                        </div>
                      )}

                      {/* Developer interest button */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => analyzeDevs(land.id)}
                        disabled={isAnalyzing || reqCount === 0}
                      >
                        {isAnalyzing ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Brain className="h-3.5 w-3.5 text-primary" />
                        )}
                        <span className="text-xs">
                          {reqCount > 0
                            ? (isAr ? `تحليل ${reqCount} مطور مهتم` : `Analyze ${reqCount} interested developers`)
                            : (isAr ? "لا يوجد مطورون مهتمون" : "No interested developers")
                          }
                        </span>
                        {reqCount > 0 && !isAnalyzing && (
                          isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>

                    {/* Pulse summary */}
                    {pulse && (
                      <div className="mt-3 rounded-lg border border-border/40 bg-muted/20 p-3">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Radar className="h-3.5 w-3.5 text-primary" />
                          <span className="text-xs font-medium text-foreground">{isAr ? "نبض الموقع 900م" : "Location Pulse 900m"}</span>
                        </div>
                        <p className="text-xs font-light text-muted-foreground line-clamp-2">
                          {isAr ? pulse.ai_report_ar : pulse.ai_report_en || pulse.ai_report_ar}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Expanded: Developer analyses */}
                  {isExpanded && (
                    <div className="border-t border-border/40 bg-muted/10 p-5">
                      {isAnalyzing ? (
                        <div className="flex flex-col items-center py-8 gap-3">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          <p className="text-sm font-light text-muted-foreground">
                            {isAr ? "جاري تحليل المطورين بالذكاء الاصطناعي..." : "AI analyzing developers..."}
                          </p>
                        </div>
                      ) : landAnalyses.length === 0 ? (
                        <p className="text-center text-sm font-light text-muted-foreground py-4">
                          {isAr ? "لا توجد طلبات شراكة على هذه الأرض" : "No partnership requests for this land"}
                        </p>
                      ) : (
                        <div className="space-y-4">
                          <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                            <BarChart3 className="h-4 w-4 text-primary" />
                            {isAr ? `تحليل ${landAnalyses.length} مطور مهتم` : `Analysis of ${landAnalyses.length} interested developers`}
                          </h4>

                          {landAnalyses.map((a) => {
                            if (a.error) return null;
                            const ai = a.ai_analysis;
                            const rec = recLabels[ai.recommendation] || recLabels.cautious;
                            const RecIcon = rec.icon;
                            const scoreLabel = getScoreLabel(ai.overall_score);

                            return (
                              <div key={a.request_id} className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
                                {/* Developer header */}
                                <div className="flex items-start justify-between">
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <h5 className="font-medium text-foreground">{a.developer_name}</h5>
                                      {a.verification_status === "verified" && (
                                        <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-700 border-emerald-500/20">
                                          <Shield className="h-2.5 w-2.5 me-1" />
                                          {isAr ? "موثق" : "Verified"}
                                        </Badge>
                                      )}
                                    </div>
                                    {a.developer_brand && (
                                      <p className="text-xs font-light text-muted-foreground">{a.developer_brand}</p>
                                    )}
                                  </div>
                                  {/* Overall score */}
                                  <div className="flex flex-col items-center">
                                    <div className={`relative h-16 w-16 rounded-full border-4 ${ai.overall_score >= 75 ? "border-emerald-500" : ai.overall_score >= 50 ? "border-amber-500" : "border-red-500"} flex items-center justify-center`}>
                                      <span className="text-lg font-bold text-foreground">{ai.overall_score}</span>
                                    </div>
                                    <span className="mt-1 text-[10px] font-light text-muted-foreground">
                                      {isAr ? scoreLabel.ar : scoreLabel.en}
                                    </span>
                                  </div>
                                </div>

                                {/* Recommendation badge */}
                                <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${rec.color}`}>
                                  <RecIcon className="h-4 w-4" />
                                  <span className="text-sm font-medium">{isAr ? rec.ar : rec.en}</span>
                                  <span className="text-xs font-light">— {ai.recommendation_reason_ar}</span>
                                </div>

                                {/* Score breakdown */}
                                <div className="grid grid-cols-2 gap-3">
                                  <ScoreBar label={isAr ? "قوة البروفايل" : "Profile Strength"} score={ai.profile_score} max={20} color={getScoreColor(ai.profile_score * 5)} />
                                  <ScoreBar label={isAr ? "سجل الإنجازات" : "Track Record"} score={ai.track_record_score} max={30} color={getScoreColor(ai.track_record_score * 3.33)} />
                                  <ScoreBar label={isAr ? "جودة المقترح" : "Proposal Quality"} score={ai.proposal_score} max={25} color={getScoreColor(ai.proposal_score * 4)} />
                                  <ScoreBar label={isAr ? "الموثوقية" : "Reliability"} score={ai.reliability_score} max={25} color={getScoreColor(ai.reliability_score * 4)} />
                                </div>

                                {/* Stats KPIs */}
                                <div className="grid grid-cols-3 gap-2">
                                  {[
                                    { label: isAr ? "صفقات ناجحة" : "Closed Deals", value: a.stats.closed_deals, icon: TrendingUp },
                                    { label: isAr ? "صفقات نشطة" : "Active Deals", value: a.stats.active_deals, icon: BarChart3 },
                                    { label: isAr ? "نسبة الصحة" : "Health Ratio", value: `${a.stats.health_ratio}%`, icon: Shield },
                                  ].map((kpi, i) => (
                                    <div key={i} className="rounded-lg border border-border/40 bg-muted/20 p-2.5 text-center">
                                      <kpi.icon className="mx-auto mb-1 h-3.5 w-3.5 text-muted-foreground" />
                                      <p className="text-lg font-medium text-foreground">{kpi.value}</p>
                                      <p className="text-[10px] font-light text-muted-foreground">{kpi.label}</p>
                                    </div>
                                  ))}
                                </div>

                                {/* Proposal details */}
                                <div className="rounded-lg border border-border/40 bg-muted/20 p-3 space-y-2">
                                  <div className="flex items-center gap-1.5">
                                    <FileText className="h-3.5 w-3.5 text-primary" />
                                    <span className="text-xs font-medium text-foreground">{isAr ? "تفاصيل المقترح" : "Proposal Details"}</span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 text-xs font-light text-muted-foreground">
                                    <span>{isAr ? "نوع المشروع:" : "Type:"} {a.proposed_project_type}</span>
                                    <span>{isAr ? "العمولة:" : "Commission:"} {a.commission_rate}%</span>
                                    {a.estimated_duration_months && (
                                      <span>{isAr ? "المدة:" : "Duration:"} {a.estimated_duration_months} {isAr ? "شهر" : "months"}</span>
                                    )}
                                    <span>{isAr ? "تمويل:" : "Financing:"} {a.needs_financing ? (isAr ? "مطلوب" : "Needed") : (isAr ? "غير مطلوب" : "Not needed")}</span>
                                  </div>
                                  <p className="text-xs font-light text-muted-foreground">{a.proposal_summary}</p>
                                </div>

                                {/* AI Summary */}
                                <p className="text-sm font-light text-foreground leading-relaxed">{ai.summary_ar}</p>

                                {/* Strengths & Weaknesses */}
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-1.5">
                                    <span className="text-xs font-medium text-emerald-700">{isAr ? "نقاط القوة" : "Strengths"}</span>
                                    {ai.strengths_ar?.map((s, i) => (
                                      <div key={i} className="flex items-start gap-1.5 text-xs font-light text-muted-foreground">
                                        <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" />
                                        <span>{s}</span>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="space-y-1.5">
                                    <span className="text-xs font-medium text-red-700">{isAr ? "نقاط الضعف" : "Weaknesses"}</span>
                                    {ai.weaknesses_ar?.map((w, i) => (
                                      <div key={i} className="flex items-start gap-1.5 text-xs font-light text-muted-foreground">
                                        <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-red-500" />
                                        <span>{w}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Negotiation tips */}
                                {ai.negotiation_tips_ar && ai.negotiation_tips_ar.length > 0 && (
                                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-1.5">
                                    <span className="text-xs font-medium text-primary">{isAr ? "نصائح للتفاوض" : "Negotiation Tips"}</span>
                                    {ai.negotiation_tips_ar.map((t, i) => (
                                      <div key={i} className="flex items-start gap-1.5 text-xs font-light text-foreground">
                                        <span className="shrink-0 text-primary">{i + 1}.</span>
                                        <span>{t}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Website Analysis */}
                                <div className="border-t border-border/40 pt-4">
                                  <h6 className="text-xs font-medium text-foreground mb-2 flex items-center gap-1.5">
                                    <Globe className="h-3.5 w-3.5 text-primary" />
                                    {isAr ? "تحليل الموقع الإلكتروني للمطور" : "Developer Website Analysis"}
                                  </h6>
                                  <DevWebsiteAnalysis
                                    developerName={a.developer_name}
                                    developerId={a.developer_id}
                                    isAr={isAr}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default OwnerDashboard;
