import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useAuth } from "@/contexts/AuthContext";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus, Globe, Building2, Sparkles, Loader2, Trash2, ExternalLink, Search,
} from "lucide-react";

type TargetCompany = {
  id: string;
  company_name: string;
  website: string | null;
  project_count: number;
  ai_strength_score: number | null;
  ai_analysis: string | null;
  is_registered: boolean;
  notes: string | null;
  created_at: string;
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
  const [aiSearching, setAiSearching] = useState(false);
  const [aiSearchQuery, setAiSearchQuery] = useState("");

  // Add form
  const [form, setForm] = useState({ company_name: "", website: "", project_count: 0 });

  const fetchCompanies = async () => {
    const { data } = await supabase
      .from("target_companies")
      .select("*")
      .order("created_at", { ascending: false });
    setCompanies((data as any[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchCompanies(); }, []);

  // Check if company is registered as developer
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

  const handleAnalyze = async (company: TargetCompany) => {
    setAnalyzing(company.id);
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-ai`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [{
              role: "user",
              content: `حلل قوة الشركة العقارية "${company.company_name}" ${company.website ? `(الموقع: ${company.website})` : ""} واعطني تقييماً من 0-100 مع تحليل موجز لنقاط القوة والضعف. أجب بصيغة JSON فقط: {"score": number, "analysis": "text"}`,
            }],
          }),
        }
      );

      if (!resp.ok || !resp.body) throw new Error("Failed");

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

      // Try to parse JSON from response
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

  const handleAiSearch = async () => {
    if (!aiSearchQuery.trim() || !user) return;
    setAiSearching(true);
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-ai`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [{
              role: "user",
              content: `ابحث عن شركات تطوير عقاري في السعودية متخصصة في "${aiSearchQuery}". أعطني قائمة بأهم 5 شركات بصيغة JSON فقط: [{"name": "اسم الشركة", "website": "url", "projects": number}]`,
            }],
          }),
        }
      );

      if (!resp.ok || !resp.body) throw new Error("Failed");

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

      const jsonMatch = fullText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const results = JSON.parse(jsonMatch[0]);
        for (const r of results) {
          const isReg = await checkRegistered(r.name);
          await supabase.from("target_companies").insert({
            company_name: r.name,
            website: r.website || null,
            project_count: r.projects || 0,
            is_registered: isReg || false,
            added_by: user.id,
          } as any);
        }
        fetchCompanies();
        toast({ title: isAr ? `تمت إضافة ${results.length} شركات` : `Added ${results.length} companies` });
      }
    } catch {
      toast({ variant: "destructive", title: isAr ? "فشل البحث" : "Search Failed" });
    }
    setAiSearching(false);
  };

  const getScoreColor = (score: number | null) => {
    if (!score) return "bg-muted text-muted-foreground";
    if (score >= 80) return "bg-green-500/10 text-green-600 border-green-500/20";
    if (score >= 50) return "bg-amber-500/10 text-amber-600 border-amber-500/20";
    return "bg-red-500/10 text-red-600 border-red-500/20";
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
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="doma-gradient gap-2"><Plus className="h-4 w-4" />{isAr ? "إضافة شركة" : "Add Company"}</Button>
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

      {/* AI Search */}
      <div className="mb-6 doma-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-medium">{isAr ? "بحث ذكي عن شركات" : "AI Company Search"}</h3>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder={isAr ? "مثال: شركات تطوير سكني في الرياض" : "e.g., residential developers in Riyadh"}
            value={aiSearchQuery}
            onChange={e => setAiSearchQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAiSearch()}
          />
          <Button onClick={handleAiSearch} disabled={aiSearching} className="gap-2">
            {aiSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            {isAr ? "بحث" : "Search"}
          </Button>
        </div>
      </div>

      {/* Companies Grid */}
      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-48 animate-pulse rounded-xl bg-muted" />)}
        </div>
      ) : companies.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">
          <Building2 className="mx-auto mb-3 h-10 w-10 opacity-30" />
          <p>{isAr ? "لا توجد شركات مستهدفة بعد" : "No target companies yet"}</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {companies.map(c => (
            <div
              key={c.id}
              className={`doma-card relative overflow-hidden p-4 transition-all hover:doma-shadow ${
                c.is_registered ? "border-l-4 border-l-green-500" : ""
              }`}
            >
              {/* Registered badge */}
              {c.is_registered && (
                <span className="absolute top-2 end-2 rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-600">
                  {isAr ? "مسجلة ✓" : "Registered ✓"}
                </span>
              )}

              <div className="mb-2 flex items-start gap-2">
                <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div className="min-w-0">
                  <h3 className="font-medium text-foreground truncate">{c.company_name}</h3>
                  {c.website && (
                    <a href={c.website.startsWith("http") ? c.website : `https://${c.website}`} target="_blank" rel="noopener" className="flex items-center gap-1 text-xs text-primary hover:underline truncate">
                      <Globe className="h-3 w-3" />{c.website}
                    </a>
                  )}
                </div>
              </div>

              <div className="mb-3 flex items-center gap-3 text-xs text-muted-foreground">
                <span>{isAr ? "المشاريع" : "Projects"}: {c.project_count}</span>
                {c.ai_strength_score !== null && (
                  <span className={`rounded-full border px-2 py-0.5 font-medium ${getScoreColor(c.ai_strength_score)}`}>
                    {c.ai_strength_score}/100
                  </span>
                )}
              </div>

              {c.ai_analysis && (
                <p className="mb-3 text-xs text-muted-foreground line-clamp-3" dir="auto">{c.ai_analysis}</p>
              )}

              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 gap-1 text-xs"
                  disabled={analyzing === c.id}
                  onClick={() => handleAnalyze(c)}
                >
                  {analyzing === c.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                  {isAr ? "تحليل" : "Analyze"}
                </Button>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(c.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* X Deals Section */}
      <div className="mt-8 doma-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <ExternalLink className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-medium text-foreground">{isAr ? "صفقات وإفراغات عقارية" : "Real Estate Deals & Transfers"}</h2>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          {isAr ? "تابع آخر الصفقات والإفراغات العقارية من حسابات X الموثوقة" : "Follow latest deals and transfers from trusted X accounts"}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <a
            href="https://x.com/Aqarsas"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl border border-border/60 bg-surface p-4 transition-all hover:border-primary/30 hover:doma-shadow"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black text-white font-bold text-lg">𝕏</div>
            <div>
              <p className="font-medium text-foreground">@Aqarsas</p>
              <p className="text-xs text-muted-foreground">{isAr ? "صفقات عقارية وإفراغات" : "Real estate deals & transfers"}</p>
            </div>
            <ExternalLink className="ms-auto h-4 w-4 text-muted-foreground" />
          </a>
          <a
            href="https://x.com/GoSuhail"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl border border-border/60 bg-surface p-4 transition-all hover:border-primary/30 hover:doma-shadow"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black text-white font-bold text-lg">𝕏</div>
            <div>
              <p className="font-medium text-foreground">@GoSuhail</p>
              <p className="text-xs text-muted-foreground">{isAr ? "أخبار وصفقات عقارية" : "Real estate news & deals"}</p>
            </div>
            <ExternalLink className="ms-auto h-4 w-4 text-muted-foreground" />
          </a>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminTargets;
