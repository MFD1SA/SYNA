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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { FileText, Pencil, Plus, Trash2, Save } from "lucide-react";

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
    const { error } = await supabase.from("platform_content").update({
      title_ar: form.title_ar,
      title_en: form.title_en,
      body_ar: form.body_ar,
      body_en: form.body_en,
      is_active: form.is_active,
      updated_by: user!.id,
    }).eq("id", editDialog.id);

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
    const { data, error } = await supabase.from("platform_content").insert({
      ...form,
      updated_by: user!.id,
    }).select().single();

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
      content_key: item.content_key,
      title_ar: item.title_ar,
      title_en: item.title_en,
      body_ar: item.body_ar,
      body_en: item.body_en,
      content_type: item.content_type,
      is_active: item.is_active,
    });
    setEditDialog(item);
  };

  return (
    <AdminLayout>
      <AdminPageHeader
        icon={FileText}
        titleAr="إدارة المحتوى"
        titleEn="Content Management"
        descAr="تعديل نصوص المنصة والإشعارات والرسائل"
        descEn="Edit platform texts, notifications, and messages"
        actions={
          <Button size="sm" className="doma-gradient gap-1.5" onClick={() => { setForm({ content_key: "", title_ar: "", title_en: "", body_ar: "", body_en: "", content_type: "text", is_active: true }); setAddDialog(true); }}>
            <Plus className="h-3.5 w-3.5" />{isAr ? "إضافة" : "Add"}
          </Button>
        }
      />

      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />)}</div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center py-16">
          <FileText className="mb-4 h-12 w-12 text-muted-foreground/30" strokeWidth={1} />
          <p className="text-sm font-light text-muted-foreground">{isAr ? "لا يوجد محتوى" : "No content"}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className="doma-card p-4 flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <code className="text-xs font-mono text-primary bg-primary/5 px-1.5 py-0.5 rounded">{item.content_key}</code>
                  <Badge variant="outline" className="text-[10px]">{item.content_type}</Badge>
                  {!item.is_active && <Badge variant="outline" className="text-[10px] bg-red-500/10 text-red-700">{isAr ? "معطل" : "Disabled"}</Badge>}
                </div>
                <p className="text-sm font-light text-foreground truncate">{isAr ? item.title_ar : item.title_en}</p>
                <p className="text-xs font-light text-muted-foreground truncate">{isAr ? item.body_ar : item.body_en}</p>
              </div>
              <div className="flex items-center gap-1.5 ms-3 shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}>
                  <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(item)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit/Add Dialog */}
      <Dialog open={!!editDialog || addDialog} onOpenChange={o => { if (!o) { setEditDialog(null); setAddDialog(false); } }}>
        <DialogContent className="sm:max-w-lg">
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
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setEditDialog(null); setAddDialog(false); }}>{isAr ? "إلغاء" : "Cancel"}</Button>
              <Button className="doma-gradient gap-1.5" onClick={editDialog ? handleSave : handleAdd}>
                <Save className="h-3.5 w-3.5" />{isAr ? "حفظ" : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminContent;
