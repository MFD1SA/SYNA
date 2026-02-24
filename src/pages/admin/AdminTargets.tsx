import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useAuth } from "@/contexts/AuthContext";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus, Globe, Building2, Sparkles, Loader2, Trash2, ExternalLink, Search,
  UserCheck, Newspaper, RefreshCw,
} from "lucide-react";

type TargetCompany = {
  id: string;
  company_name: string;
  website: string | null;
  project_count: number;
  ai_strength_score: number | null;
  ai_analysis: string | null;
  is_registered: boolean;
  lead_status: string;
  notes: string | null;
  created_at: string;
};

type DealNews = {
  title: string;
  details: string;
  source: string;
  date: string;
};

const AdminTargets: React.FC = () => {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const isAr = lang === "ar";
  usePageTitle(isAr ? "استهداف الشركات" : "Target Companies");

  const [companies, setCompanies] = useState<TargetCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [autoFetching, setAutoFetching] = useState(false);

  // Deal news
  const [dealNews, setDealNews] = useState<DealNews[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);

  // Add form
  const [form, setForm] = useState({ company_name: "", website: "", project_count: 0 });

  const callAI = async (prompt: string): Promise<string> => {
    const resp = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-ai`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: [{ role: "user", content: prompt }] }),
      }
    );
    if (!resp.ok || !resp.body) throw new Error("AI call failed");
    let fullText = "";
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      for (const line of chunk.split("\n")) {
        if (!line.startsWith("data: ")) continue;
        const json = line.slice(6).trim();
        if (json === "[DONE]") break;
        try {
          const parsed = JSON.parse(json);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) fullText += content;
        } catch {}
      }
    }
    return fullText;
  };

  const fetchCompanies = async () => {
    const { data } = await supabase
      .from("target_companies")
      .select("*")
      .order("created_at", { ascending: false });
    setCompanies((data as any[]) || []);
    setLoading(false);
  };

  const autoFetchCompanies = useCallback(async () => {
    if (!user || autoFetching) return;
    setAutoFetching(true);
    try {
      const text = await callAI(
        `أنت خبير في السوق العقاري السعودي. أريد قائمة بأهم 20 شركة تطوير عقاري في السعودية (شركات لديها مشاريع تطوير فعلية وليس شركات تسويق عقاري). لكل شركة أعطني: اسمها الرسمي، موقعها الإلكتروني، وعدد مشاريعها التقريبي. أجب بصيغة JSON فقط بدون أي نص إضافي: [{"name": "اسم الشركة", "website": "url", "projects": number}]`
      );
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const results = JSON.parse(jsonMatch[0]);
        let added = 0;
        for (const r of results) {
          // Check if already exists
          const { data: existing } = await supabase
            .from("target_companies")
            .select("id")
            .eq("company_name", r.name)
            .maybeSingle();
          if (existing) continue;
          
          const isReg = await checkRegistered(r.name);
          await supabase.from("target_companies").insert({
            company_name: r.name,
            website: r.website || null,
            project_count: r.projects || 0,
            is_registered: isReg || false,
            lead_status: "new",
            added_by: user.id,
          } as any);
          added++;
        }
        if (added > 0) {
          fetchCompanies();
          toast({ title: isAr ? `تم جلب ${added} شركة تطوير` : `Fetched ${added} dev companies` });
        }
      }
    } catch {
      toast({ variant: "destructive", title: isAr ? "فشل الجلب التلقائي" : "Auto-fetch failed" });
    }
    setAutoFetching(false);
  }, [user]);

  const fetchDealNews = async () => {
    setNewsLoading(true);
    try {
      const text = await callAI(
        `أنت محلل صفقات عقارية في السعودية. ابحث عن آخر 10 صفقات وإفراغات عقارية كبيرة في السوق السعودي من مصادر مثل حسابات @Aqarsas و @GoSuhail وغيرها. لكل صفقة اذكر: عنوان الصفقة، تفاصيلها (المبلغ والموقع والمساحة إن توفرت)، المصدر، والتاريخ التقريبي. أجب بصيغة JSON فقط: [{"title": "عنوان", "details": "تفاصيل", "source": "المصدر", "date": "التاريخ"}]`
      );
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        setDealNews(JSON.parse(jsonMatch[0]));
      }
    } catch {
      toast({ variant: "destructive", title: isAr ? "فشل جلب الأخبار" : "Failed to fetch news" });
    }
    setNewsLoading(false);
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  // Auto-fetch companies if empty
  useEffect(() => {
    if (!loading && companies.length === 0 && user) {
      autoFetchCompanies();
    }
  }, [loading, companies.length, user]);

  // Auto-fetch news on load
  useEffect(() => {
    fetchDealNews();
  }, []);

  const checkRegistered = async (name: string) => {
    const { data } = await supabase
      .from("developers")
      .select("id, company_name")
      .or(`company_name.ilike.%${name}%,marketing_brand_name.ilike.%${name}%`);
    return data && data.length > 0;
  };

  const handleAdd = async () => {
    if (!form.company_name.trim() || !user) return;
    const isReg = await checkRegistered(form.company_name);
    const { error } = await supabase.from("target_companies").insert({
      company_name: form.company_name,
      website: form.website || null,
      project_count: form.project_count,
      is_registered: isReg || false,
      lead_status: "new",
      added_by: user.id,
    } as any);
    if (error) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: error.message });
    } else {
      toast({ title: isAr ? "تمت الإضافة" : "Added" });
      setForm({ company_name: "", website: "", project_count: 0 });
      setAddOpen(false);
      fetchCompanies();
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("target_companies").delete().eq("id", id);
    fetchCompanies();
  };

  const handleToggleProspect = async (company: TargetCompany) => {
    const newStatus = company.lead_status === "prospect" ? "new" : "prospect";
    await supabase.from("target_companies").update({ lead_status: newStatus } as any).eq("id", company.id);
    fetchCompanies();
    toast({
      title: newStatus === "prospect"
        ? (isAr ? "تم تحويلها لعميل محتمل ✓" : "Marked as prospect ✓")
        : (isAr ? "تم إلغاء التحويل" : "Unmarked as prospect"),
    });
  };

  const handleAnalyze = async (company: TargetCompany) => {
    setAnalyzing(company.id);
    try {
      const fullText = await callAI(
        `حلل قوة الشركة العقارية "${company.company_name}" ${company.website ? `(الموقع: ${company.website})` : ""} واعطني تقييماً من 0-100 مع تحليل موجز لنقاط القوة والضعف. أجب بصيغة JSON فقط: {"score": number, "analysis": "text"}`
      );
      const jsonMatch = fullText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        await supabase.from("target_companies").update({
          ai_strength_score: result.score,
          ai_analysis: result.analysis,
        } as any).eq("id", company.id);
        fetchCompanies();
        toast({ title: isAr ? "تم التحليل" : "Analysis Complete" });
      }
    } catch {
      toast({ variant: "destructive", title: isAr ? "فشل التحليل" : "Analysis Failed" });
    }
    setAnalyzing(null);
  };

  const getScoreColor = (score: number | null) => {
    if (!score) return "bg-muted text-muted-foreground";
    if (score >= 80) return "bg-green-500/10 text-green-600 border-green-500/20";
    if (score >= 50) return "bg-amber-500/10 text-amber-600 border-amber-500/20";
    return "bg-red-500/10 text-red-600 border-red-500/20";
  };

  const getLeadBadge = (status: string) => {
    if (status === "prospect") return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    if (status === "client") return "bg-green-500/10 text-green-600 border-green-500/20";
    return "";
  };

  return (
    <AdminLayout>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-medium text-foreground">
            {isAr ? "استهداف الشركات العقارية" : "Target Companies"}
          </h1>
          <p className="mt-1 text-sm font-light text-muted-foreground">
            {isAr ? "تتبع وتحليل شركات التطوير العقاري المستهدفة" : "Track and analyze target real estate companies"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={autoFetchCompanies} disabled={autoFetching} className="gap-2">
            {autoFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {isAr ? "جلب شركات جديدة" : "Fetch Companies"}
          </Button>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button className="doma-gradient gap-2"><Plus className="h-4 w-4" />{isAr ? "إضافة يدوية" : "Add Manually"}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{isAr ? "إضافة شركة مستهدفة" : "Add Target Company"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <Input placeholder={isAr ? "اسم الشركة" : "Company Name"} value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} />
                <Input placeholder={isAr ? "الموقع الإلكتروني" : "Website"} value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} />
                <Input type="number" placeholder={isAr ? "عدد المشاريع" : "Project Count"} value={form.project_count} onChange={e => setForm(f => ({ ...f, project_count: Number(e.target.value) }))} />
                <Button onClick={handleAdd} className="w-full doma-gradient">{isAr ? "إضافة" : "Add"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Companies Grid */}
      {loading || autoFetching ? (
        <div className="mb-8">
          {autoFetching && (
            <div className="mb-4 flex items-center gap-2 text-sm text-primary">
              <Loader2 className="h-4 w-4 animate-spin" />
              {isAr ? "جاري جلب شركات التطوير العقاري تلقائياً..." : "Auto-fetching development companies..."}
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <div key={i} className="h-44 animate-pulse rounded-xl bg-muted" />)}
          </div>
        </div>
      ) : companies.length === 0 ? (
        <div className="mb-8 py-20 text-center text-muted-foreground">
          <Building2 className="mx-auto mb-3 h-10 w-10 opacity-30" />
          <p>{isAr ? "لا توجد شركات مستهدفة بعد" : "No target companies yet"}</p>
        </div>
      ) : (
        <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {companies.map(c => (
            <div
              key={c.id}
              className={`doma-card relative overflow-hidden p-4 transition-all hover:doma-shadow ${
                c.is_registered ? "border-l-4 border-l-green-500" : ""
              } ${c.lead_status === "prospect" ? "ring-2 ring-blue-500/30" : ""}`}
            >
              {/* Badges */}
              <div className="absolute top-2 end-2 flex gap-1">
                {c.is_registered && (
                  <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-600">
                    {isAr ? "مسجلة ✓" : "Registered ✓"}
                  </span>
                )}
                {c.lead_status === "prospect" && (
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${getLeadBadge("prospect")}`}>
                    {isAr ? "عميل محتمل" : "Prospect"}
                  </span>
                )}
              </div>

              <div className="mb-2 flex items-start gap-2">
                <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div className="min-w-0">
                  <h3 className="font-medium text-foreground truncate text-sm">{c.company_name}</h3>
                  {c.website && (
                    <a href={c.website.startsWith("http") ? c.website : `https://${c.website}`} target="_blank" rel="noopener" className="flex items-center gap-1 text-[11px] text-primary hover:underline truncate">
                      <Globe className="h-3 w-3 shrink-0" /><span className="truncate">{c.website}</span>
                    </a>
                  )}
                </div>
              </div>

              <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
                <span>{isAr ? "المشاريع" : "Projects"}: {c.project_count}</span>
                {c.ai_strength_score !== null && (
                  <span className={`rounded-full border px-2 py-0.5 font-medium ${getScoreColor(c.ai_strength_score)}`}>
                    {c.ai_strength_score}/100
                  </span>
                )}
              </div>

              {c.ai_analysis && (
                <p className="mb-3 text-[11px] text-muted-foreground line-clamp-2" dir="auto">{c.ai_analysis}</p>
              )}

              {/* Actions */}
              <div className="flex items-center gap-1">
                <div className="flex items-center gap-1.5 me-auto" title={isAr ? "تحويل لعميل محتمل" : "Mark as prospect"}>
                  <Switch
                    checked={c.lead_status === "prospect"}
                    onCheckedChange={() => handleToggleProspect(c)}
                    className="scale-75"
                  />
                  <span className="text-[10px] text-muted-foreground">
                    {isAr ? "محتمل" : "Prospect"}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 text-[11px] h-7 px-2"
                  disabled={analyzing === c.id}
                  onClick={() => handleAnalyze(c)}
                >
                  {analyzing === c.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                  {isAr ? "تحليل" : "Analyze"}
                </Button>
                <Button size="sm" variant="ghost" className="text-destructive h-7 w-7 p-0" onClick={() => handleDelete(c.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Deal News Section */}
      <div className="doma-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Newspaper className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-medium text-foreground">{isAr ? "آخر الصفقات والإفراغات العقارية" : "Latest Real Estate Deals"}</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <a href="https://x.com/Aqarsas" target="_blank" rel="noopener" className="flex h-7 w-7 items-center justify-center rounded-md bg-black text-white text-[10px] font-bold hover:opacity-80">𝕏</a>
              <a href="https://x.com/GoSuhail" target="_blank" rel="noopener" className="flex h-7 w-7 items-center justify-center rounded-md bg-black text-white text-[10px] font-bold hover:opacity-80">𝕏</a>
            </div>
            <Button size="sm" variant="outline" onClick={fetchDealNews} disabled={newsLoading} className="gap-1 h-7">
              {newsLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
              {isAr ? "تحديث" : "Refresh"}
            </Button>
          </div>
        </div>

        {newsLoading && dealNews.length === 0 ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />)}
          </div>
        ) : dealNews.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">{isAr ? "لا توجد أخبار حالياً" : "No news available"}</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {dealNews.map((news, i) => (
              <div key={i} className="rounded-xl border border-border/60 bg-surface p-3 transition-all hover:border-primary/20">
                <h4 className="text-sm font-medium text-foreground mb-1" dir="auto">{news.title}</h4>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2" dir="auto">{news.details}</p>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>{news.source}</span>
                  <span>{news.date}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminTargets;
