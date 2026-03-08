import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useAuth } from "@/contexts/AuthContext";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus, Globe, Building2, Trash2, Newspaper, RefreshCw, Loader2,
  UserCheck, Phone, User, ImagePlus,
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
  contact_person_name: string | null;
  contact_phone: string | null;
  image_url: string | null;
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
  usePageTitle(isAr ? "إدارة الشركات" : "Company Management");

  const [companies, setCompanies] = useState<TargetCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);

  // Deal news
  const [dealNews, setDealNews] = useState<DealNews[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);

  // Add form
  const [form, setForm] = useState({
    company_name: "",
    website: "",
    image_url: "",
    contact_person_name: "",
    contact_phone: "",
  });
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `targets/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("land-images").upload(path, file);
    if (error) {
      toast({ variant: "destructive", title: isAr ? "خطأ في الرفع" : "Upload Error", description: error.message });
    } else {
      const { data: urlData } = supabase.storage.from("land-images").getPublicUrl(path);
      setForm(f => ({ ...f, image_url: urlData.publicUrl }));
    }
    setUploading(false);
  };

  const callAI = async (prompt: string): Promise<string> => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error("Not authenticated");

    const resp = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-ai`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
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
    fetchDealNews();
  }, []);

  const handleAdd = async () => {
    if (!form.company_name.trim() || !user) return;
    const { error } = await supabase.from("target_companies").insert({
      company_name: form.company_name,
      website: form.website || null,
      image_url: form.image_url || null,
      contact_person_name: form.contact_person_name || null,
      contact_phone: form.contact_phone || null,
      is_registered: false,
      lead_status: "new",
      added_by: user.id,
    } as any);
    if (error) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: error.message });
    } else {
      toast({ title: isAr ? "تمت الإضافة" : "Added" });
      setForm({ company_name: "", website: "", image_url: "", contact_person_name: "", contact_phone: "" });
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

  const getLeadBadge = (status: string) => {
    if (status === "prospect") return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    if (status === "client") return "bg-green-500/10 text-green-600 border-green-500/20";
    return "";
  };

  return (
    <AdminLayout>
      <div dir={isAr ? "rtl" : "ltr"}>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-medium text-foreground">
            {isAr ? "إدارة الشركات" : "Company Management"}
          </h1>
          <p className="mt-1 text-sm font-light text-muted-foreground">
            {isAr ? "إضافة وإدارة الشركات المستهدفة يدوياً" : "Add and manage target companies manually"}
          </p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="doma-gradient gap-2"><Plus className="h-4 w-4" />{isAr ? "إضافة شركة" : "Add Company"}</Button>
          </DialogTrigger>
          <DialogContent dir={isAr ? "rtl" : "ltr"}>
            <DialogHeader>
              <DialogTitle>{isAr ? "إضافة شركة جديدة" : "Add New Company"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label className="text-sm">{isAr ? "اسم الشركة" : "Company Name"} <span className="text-destructive">*</span></Label>
                <Input placeholder={isAr ? "اسم الشركة" : "Company Name"} value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">{isAr ? "الموقع الإلكتروني" : "Website"}</Label>
                <Input dir="ltr" placeholder="https://example.com" value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">{isAr ? "صورة / شعار الشركة" : "Company Logo/Image"}</Label>
                {form.image_url && (
                  <div className="mb-2 overflow-hidden rounded-lg">
                    <img src={form.image_url} alt="Preview" className="h-24 w-full object-contain rounded-lg bg-muted" />
                  </div>
                )}
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border/60 p-4 transition-colors hover:border-primary/40 hover:bg-primary/5">
                  <ImagePlus className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {uploading ? (isAr ? "جاري الرفع..." : "Uploading...") : (isAr ? "اختر صورة" : "Choose Image")}
                  </span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                </label>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">{isAr ? "اسم المسؤول" : "Contact Person"}</Label>
                <Input placeholder={isAr ? "اسم المسؤول" : "Contact Person Name"} value={form.contact_person_name} onChange={e => setForm(f => ({ ...f, contact_person_name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">{isAr ? "رقم الاتصال" : "Phone Number"}</Label>
                <Input dir="ltr" placeholder="05XXXXXXXX" value={form.contact_phone} onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))} />
              </div>
              <Button onClick={handleAdd} className="w-full doma-gradient" disabled={!form.company_name.trim()}>
                {isAr ? "إضافة" : "Add"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Companies Grid */}
      {loading ? (
        <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-44 animate-pulse rounded-xl bg-muted" />)}
        </div>
      ) : companies.length === 0 ? (
        <div className="mb-8 py-20 text-center text-muted-foreground">
          <Building2 className="mx-auto mb-3 h-10 w-10 opacity-30" />
          <p>{isAr ? "لا توجد شركات بعد، أضف أول شركة" : "No companies yet, add the first one"}</p>
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

              <div className="mb-3 flex items-start gap-3">
                {/* Company image */}
                {c.image_url ? (
                  <img src={c.image_url} alt={c.company_name} className="h-10 w-10 rounded-lg object-cover shrink-0 bg-muted" />
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent">
                    <Building2 className="h-5 w-5 text-accent-foreground" />
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="font-medium text-foreground truncate text-sm">{c.company_name}</h3>
                  {c.website && (
                    <a href={c.website.startsWith("http") ? c.website : `https://${c.website}`} target="_blank" rel="noopener" className="flex items-center gap-1 text-[11px] text-primary hover:underline truncate">
                      <Globe className="h-3 w-3 shrink-0" /><span className="truncate">{c.website}</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Contact info */}
              {(c.contact_person_name || c.contact_phone) && (
                <div className="mb-3 space-y-1 text-xs text-muted-foreground">
                  {c.contact_person_name && (
                    <div className="flex items-center gap-1.5">
                      <User className="h-3 w-3 shrink-0" />
                      <span>{c.contact_person_name}</span>
                    </div>
                  )}
                  {c.contact_phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3 w-3 shrink-0" />
                      <span dir="ltr">{c.contact_phone}</span>
                    </div>
                  )}
                </div>
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
              <a href="https://x.com/Aqarsas" target="_blank" rel="noopener" className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground text-background text-[10px] font-bold hover:opacity-80">𝕏</a>
              <a href="https://x.com/GoSuhail" target="_blank" rel="noopener" className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground text-background text-[10px] font-bold hover:opacity-80">𝕏</a>
            </div>
            <Button size="sm" variant="outline" onClick={fetchDealNews} disabled={newsLoading} className="gap-1 h-7">
              {newsLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
              {isAr ? "تحديث" : "Refresh"}
            </Button>
          </div>
        </div>

        {newsLoading && dealNews.length === 0 ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />)}
          </div>
        ) : dealNews.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">{isAr ? "لا توجد أخبار حالياً" : "No news available"}</p>
        ) : (
          <div className="space-y-2">
            {dealNews.map((news, i) => (
              <div key={i} className="rounded-lg border border-border/40 p-3 hover:bg-muted/30 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-medium text-foreground">{news.title}</h3>
                  <span className="shrink-0 text-[10px] text-muted-foreground">{news.date}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{news.details}</p>
                <p className="mt-1 text-[10px] text-primary">{news.source}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminTargets;
