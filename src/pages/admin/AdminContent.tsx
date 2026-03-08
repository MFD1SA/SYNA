import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logAudit } from "@/lib/auditLog";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  FileText, Pencil, Plus, Trash2, Save, CheckCircle2, AlertCircle,
  Globe, Layout, Phone, Mail, MapPin, Shield, Loader2, Info, Eye
} from "lucide-react";

// Expected content keys for the landing page sections
const EXPECTED_SECTIONS = [
  { key: "hero_title", group: "hero", ar: "عنوان البطل", en: "Hero Title" },
  { key: "hero_subtitle", group: "hero", ar: "وصف البطل", en: "Hero Subtitle" },
  { key: "hero_cta", group: "hero", ar: "زر الإجراء", en: "Hero CTA" },
  { key: "features_title", group: "features", ar: "عنوان المميزات", en: "Features Title" },
  { key: "features_desc", group: "features", ar: "وصف المميزات", en: "Features Description" },
  { key: "feature_1", group: "features", ar: "ميزة 1", en: "Feature 1" },
  { key: "feature_2", group: "features", ar: "ميزة 2", en: "Feature 2" },
  { key: "feature_3", group: "features", ar: "ميزة 3", en: "Feature 3" },
  { key: "opportunities_title", group: "opportunities", ar: "عنوان الفرص", en: "Opportunities Title" },
  { key: "opportunities_desc", group: "opportunities", ar: "وصف الفرص", en: "Opportunities Description" },
  { key: "subscriptions_title", group: "subscriptions", ar: "عنوان الاشتراكات", en: "Subscriptions Title" },
  { key: "subscriptions_desc", group: "subscriptions", ar: "وصف الاشتراكات", en: "Subscriptions Description" },
  { key: "faq_title", group: "faq", ar: "عنوان الأسئلة", en: "FAQ Title" },
  { key: "faq_1_q", group: "faq", ar: "سؤال 1", en: "FAQ Question 1" },
  { key: "faq_1_a", group: "faq", ar: "إجابة 1", en: "FAQ Answer 1" },
  { key: "faq_2_q", group: "faq", ar: "سؤال 2", en: "FAQ Question 2" },
  { key: "faq_2_a", group: "faq", ar: "إجابة 2", en: "FAQ Answer 2" },
  { key: "about_title", group: "pages", ar: "عنوان من نحن", en: "About Title" },
  { key: "about_body", group: "pages", ar: "محتوى من نحن", en: "About Body" },
  { key: "privacy_title", group: "pages", ar: "عنوان الخصوصية", en: "Privacy Title" },
  { key: "privacy_body", group: "pages", ar: "محتوى الخصوصية", en: "Privacy Body" },
  { key: "terms_title", group: "pages", ar: "عنوان الشروط", en: "Terms Title" },
  { key: "terms_body", group: "pages", ar: "محتوى الشروط", en: "Terms Body" },
  { key: "usage_policy_title", group: "pages", ar: "عنوان سياسة الاستخدام", en: "Usage Policy Title" },
  { key: "usage_policy_body", group: "pages", ar: "محتوى سياسة الاستخدام", en: "Usage Policy Body" },
  { key: "contact_email", group: "contact", ar: "بريد التواصل", en: "Contact Email" },
  { key: "contact_phone", group: "contact", ar: "رقم التواصل", en: "Contact Phone" },
  { key: "contact_address", group: "contact", ar: "العنوان", en: "Address" },
  { key: "footer_text", group: "footer", ar: "نص الفوتر", en: "Footer Text" },
  { key: "footer_links", group: "footer", ar: "روابط الفوتر", en: "Footer Links" },
  { key: "navbar_brand", group: "header", ar: "اسم العلامة في الهيدر", en: "Navbar Brand" },
];

const GROUP_LABELS: Record<string, { ar: string; en: string; icon: React.ElementType }> = {
  hero: { ar: "قسم البطل", en: "Hero Section", icon: Layout },
  features: { ar: "المميزات", en: "Features", icon: Shield },
  opportunities: { ar: "الفرص", en: "Opportunities", icon: Globe },
  subscriptions: { ar: "الاشتراكات", en: "Subscriptions", icon: FileText },
  faq: { ar: "الأسئلة الشائعة", en: "FAQ", icon: Info },
  pages: { ar: "الصفحات الداخلية", en: "Inner Pages", icon: FileText },
  contact: { ar: "بيانات التواصل", en: "Contact Info", icon: Phone },
  footer: { ar: "الفوتر", en: "Footer", icon: Layout },
  header: { ar: "الهيدر", en: "Header", icon: Layout },
};

const AdminContent: React.FC = () => {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const { toast } = useToast();
  const isAr = lang === "ar";
  usePageTitle(isAr ? "إدارة المحتوى" : "Content Management");

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialog, setEditDialog] = useState<any | null>(null);
  const [addDialog, setAddDialog] = useState(false);
  const [form, setForm] = useState({ content_key: "", title_ar: "", title_en: "", body_ar: "", body_en: "", content_type: "text", is_active: true });
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const fetchContent = async () => {
    const { data } = await supabase.from("platform_content").select("*").order("created_at", { ascending: true });
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchContent(); }, []);

  const audit = async (action: string, entityId: string, details: any) => {
    if (user) await logAudit(user.id, user.email, action, "content", entityId, details);
  };

  const handleSave = async () => {
    if (!editDialog) return;
    setSaving(true);
    const { error } = await supabase.from("platform_content").update({
      title_ar: form.title_ar, title_en: form.title_en,
      body_ar: form.body_ar, body_en: form.body_en,
      is_active: form.is_active, updated_by: user!.id,
    }).eq("id", editDialog.id);
    setSaving(false);

    if (error) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: error.message });
    } else {
      await audit("update", editDialog.id, { content_key: editDialog.content_key });
      toast({ title: isAr ? "تم الحفظ" : "Saved" });
      setEditDialog(null);
      fetchContent();
    }
  };

  const handleAdd = async () => {
    if (!form.content_key) return;
    setSaving(true);
    const { data, error } = await supabase.from("platform_content").insert({
      ...form, updated_by: user!.id,
    }).select().single();
    setSaving(false);

    if (error) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: error.message });
    } else {
      await audit("create", data.id, { content_key: form.content_key });
      toast({ title: isAr ? "تم الإضافة" : "Added" });
      setAddDialog(false);
      setForm({ content_key: "", title_ar: "", title_en: "", body_ar: "", body_en: "", content_type: "text", is_active: true });
      fetchContent();
    }
  };

  const handleDelete = async (item: any) => {
    if (!confirm(isAr ? "حذف هذا المحتوى؟" : "Delete this content?")) return;
    const { error } = await supabase.from("platform_content").delete().eq("id", item.id);
    if (!error) {
      await audit("delete", item.id, { content_key: item.content_key });
      toast({ title: isAr ? "تم الحذف" : "Deleted" });
      fetchContent();
    }
  };

  const openEdit = (item: any) => {
    setForm({
      content_key: item.content_key, title_ar: item.title_ar, title_en: item.title_en,
      body_ar: item.body_ar, body_en: item.body_en, content_type: item.content_type, is_active: item.is_active,
    });
    setEditDialog(item);
  };

  const createMissing = async (section: typeof EXPECTED_SECTIONS[0]) => {
    setSaving(true);
    const { data, error } = await supabase.from("platform_content").insert({
      content_key: section.key, title_ar: section.ar, title_en: section.en,
      body_ar: "", body_en: "", content_type: "text", is_active: true, updated_by: user!.id,
    }).select().single();
    setSaving(false);
    if (!error && data) {
      await audit("create", data.id, { content_key: section.key, auto_created: true });
      toast({ title: isAr ? "تم إنشاء المحتوى" : "Content created" });
      fetchContent();
    }
  };

  // Calculate completeness
  const existingKeys = new Set(items.map(i => i.content_key));
  const filledCount = EXPECTED_SECTIONS.filter(s => {
    const item = items.find(i => i.content_key === s.key);
    return item && (item.body_ar || item.body_en);
  }).length;
  const completeness = Math.round((filledCount / EXPECTED_SECTIONS.length) * 100);
  const missingKeys = EXPECTED_SECTIONS.filter(s => !existingKeys.has(s.key));

  // Group items
  const groups = Object.keys(GROUP_LABELS);
  const getGroupItems = (group: string) => {
    const sectionKeys = EXPECTED_SECTIONS.filter(s => s.group === group).map(s => s.key);
    return items.filter(i => sectionKeys.includes(i.content_key));
  };
  const getGroupMissing = (group: string) => EXPECTED_SECTIONS.filter(s => s.group === group && !existingKeys.has(s.key));
  const getGroupCompleteness = (group: string) => {
    const sections = EXPECTED_SECTIONS.filter(s => s.group === group);
    if (sections.length === 0) return 100;
    const filled = sections.filter(s => {
      const item = items.find(i => i.content_key === s.key);
      return item && (item.body_ar || item.body_en);
    }).length;
    return Math.round((filled / sections.length) * 100);
  };

  return (
    <AdminLayout>
      <AdminPageHeader
        icon={FileText}
        titleAr="إدارة المحتوى"
        titleEn="Content Management"
        descAr="تحكم كامل في محتوى الصفحة الرئيسية والصفحات الداخلية"
        descEn="Full control over landing page and inner pages content"
        actions={
          <Button size="sm" className="gap-1.5 bg-primary hover:bg-primary/90" onClick={() => { setForm({ content_key: "", title_ar: "", title_en: "", body_ar: "", body_en: "", content_type: "text", is_active: true }); setAddDialog(true); }}>
            <Plus className="h-3.5 w-3.5" />{isAr ? "إضافة محتوى" : "Add Content"}
          </Button>
        }
      />

      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />)}</div>
      ) : (
        <div className="space-y-6" dir={isAr ? "rtl" : "ltr"}>
          {/* Completeness Dashboard */}
          <div className="rounded-xl border border-border/60 bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-medium text-foreground">{isAr ? "نسبة اكتمال المحتوى" : "Content Completeness"}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isAr ? `${filledCount} من ${EXPECTED_SECTIONS.length} حقل مُكتمل` : `${filledCount} of ${EXPECTED_SECTIONS.length} fields completed`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-2xl font-semibold ${completeness === 100 ? "text-emerald-600" : completeness >= 70 ? "text-amber-600" : "text-destructive"}`}>
                  {completeness}%
                </span>
                {completeness === 100 ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                ) : (
                  <AlertCircle className={`h-5 w-5 ${completeness >= 70 ? "text-amber-600" : "text-destructive"}`} />
                )}
              </div>
            </div>
            <Progress value={completeness} className="h-2" />
            {missingKeys.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {missingKeys.slice(0, 6).map(s => (
                  <Badge key={s.key} variant="outline" className="text-[10px] gap-1 text-destructive border-destructive/30 cursor-pointer hover:bg-destructive/5" onClick={() => createMissing(s)}>
                    <Plus className="h-2.5 w-2.5" />{isAr ? s.ar : s.en}
                  </Badge>
                ))}
                {missingKeys.length > 6 && (
                  <Badge variant="outline" className="text-[10px] text-muted-foreground">+{missingKeys.length - 6}</Badge>
                )}
              </div>
            )}
          </div>

          {/* Group Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map(group => {
              const gl = GROUP_LABELS[group];
              const GroupIcon = gl.icon;
              const groupItems = getGroupItems(group);
              const groupMissing = getGroupMissing(group);
              const groupComplete = getGroupCompleteness(group);
              const totalSections = EXPECTED_SECTIONS.filter(s => s.group === group).length;

              return (
                <div key={group} className="rounded-xl border border-border/60 bg-card p-4 hover:border-primary/20 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                        <GroupIcon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-foreground">{isAr ? gl.ar : gl.en}</h4>
                        <p className="text-[10px] text-muted-foreground">{groupItems.length}/{totalSections} {isAr ? "حقل" : "fields"}</p>
                      </div>
                    </div>
                    <span className={`text-sm font-semibold ${groupComplete === 100 ? "text-emerald-600" : "text-amber-600"}`}>{groupComplete}%</span>
                  </div>

                  <Progress value={groupComplete} className="h-1 mb-3" />

                  <div className="space-y-1.5">
                    {EXPECTED_SECTIONS.filter(s => s.group === group).map(section => {
                      const item = items.find(i => i.content_key === section.key);
                      const isFilled = item && (item.body_ar || item.body_en);
                      return (
                        <div key={section.key} className="flex items-center justify-between rounded-lg px-2.5 py-1.5 hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            {isFilled ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                            ) : item ? (
                              <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                            ) : (
                              <div className="h-3.5 w-3.5 rounded-full border-2 border-border shrink-0" />
                            )}
                            <span className="text-xs text-foreground truncate">{isAr ? section.ar : section.en}</span>
                          </div>
                          {item ? (
                            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => openEdit(item)}>
                              <Pencil className="h-3 w-3 text-muted-foreground" />
                            </Button>
                          ) : (
                            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => createMissing(section)} disabled={saving}>
                              <Plus className="h-3 w-3 text-primary" />
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* All Content Items (extra ones not in expected) */}
          {items.filter(i => !EXPECTED_SECTIONS.some(s => s.key === i.content_key)).length > 0 && (
            <div className="rounded-xl border border-border/60 bg-card p-4">
              <h4 className="text-sm font-medium text-foreground mb-3">{isAr ? "محتوى إضافي" : "Additional Content"}</h4>
              <div className="space-y-2">
                {items.filter(i => !EXPECTED_SECTIONS.some(s => s.key === i.content_key)).map(item => (
                  <div key={item.id} className="flex items-center justify-between rounded-lg border border-border/40 p-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <code className="text-[10px] font-mono text-primary bg-primary/5 px-1.5 py-0.5 rounded">{item.content_key}</code>
                        {!item.is_active && <Badge variant="outline" className="text-[10px] bg-destructive/10 text-destructive">{isAr ? "معطل" : "Disabled"}</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{isAr ? item.title_ar : item.title_en}</p>
                    </div>
                    <div className="flex items-center gap-1 ms-2 shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(item)}>
                        <Pencil className="h-3 w-3 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(item)}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit/Add Dialog */}
      <Dialog open={!!editDialog || addDialog} onOpenChange={o => { if (!o) { setEditDialog(null); setAddDialog(false); } }}>
        <DialogContent className="sm:max-w-lg" dir={isAr ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle>{editDialog ? (isAr ? "تعديل المحتوى" : "Edit Content") : (isAr ? "إضافة محتوى" : "Add Content")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {!editDialog && (
              <div className="space-y-2">
                <Label>{isAr ? "مفتاح المحتوى" : "Content Key"}</Label>
                <Input value={form.content_key} onChange={e => setForm({ ...form, content_key: e.target.value })} placeholder="hero_title" dir="ltr" />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{isAr ? "العنوان (عربي)" : "Title (Arabic)"}</Label>
                <Input value={form.title_ar} onChange={e => setForm({ ...form, title_ar: e.target.value })} dir="rtl" />
              </div>
              <div className="space-y-2">
                <Label>{isAr ? "العنوان (إنجليزي)" : "Title (English)"}</Label>
                <Input value={form.title_en} onChange={e => setForm({ ...form, title_en: e.target.value })} dir="ltr" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{isAr ? "المحتوى (عربي)" : "Body (Arabic)"}</Label>
              <Textarea value={form.body_ar} onChange={e => setForm({ ...form, body_ar: e.target.value })} rows={3} dir="rtl" />
            </div>
            <div className="space-y-2">
              <Label>{isAr ? "المحتوى (إنجليزي)" : "Body (English)"}</Label>
              <Textarea value={form.body_en} onChange={e => setForm({ ...form, body_en: e.target.value })} rows={3} dir="ltr" />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} />
              <Label>{isAr ? "مفعّل" : "Active"}</Label>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setEditDialog(null); setAddDialog(false); }}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button className="gap-1.5 bg-primary hover:bg-primary/90" onClick={editDialog ? handleSave : handleAdd} disabled={saving}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              {isAr ? "حفظ" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminContent;
