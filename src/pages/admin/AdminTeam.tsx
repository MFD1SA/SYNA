import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { logAudit } from "@/lib/auditLog";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Users, Plus, Pencil, Trash2, ShieldCheck, Shield, Eye, EyeOff,
} from "lucide-react";

interface AdminPerm {
  id: string;
  user_id: string;
  user_email: string | null;
  display_name: string | null;
  is_super_admin: boolean;
  perm_developers: boolean;
  perm_lands: boolean;
  perm_owners: boolean;
  perm_deals: boolean;
  perm_content: boolean;
  perm_ai: boolean;
  perm_audit_log: boolean;
}

const PERM_KEYS = [
  "perm_developers",
  "perm_lands",
  "perm_owners",
  "perm_deals",
  "perm_content",
  "perm_ai",
  "perm_audit_log",
] as const;

type PermKey = typeof PERM_KEYS[number];

const AdminTeam: React.FC = () => {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const { toast } = useToast();
  const isAr = lang === "ar";
  usePageTitle(isAr ? "فريق الإدارة" : "Admin Team");

  const [members, setMembers] = useState<AdminPerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editMember, setEditMember] = useState<AdminPerm | null>(null);
  const [deleteMember, setDeleteMember] = useState<AdminPerm | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Add form
  const [addForm, setAddForm] = useState({
    email: "",
    password: "",
    display_name: "",
    perm_developers: false,
    perm_lands: false,
    perm_owners: false,
    perm_deals: false,
    perm_content: false,
    perm_ai: false,
    perm_audit_log: false,
  });
  const [showAddPassword, setShowAddPassword] = useState(false);

  // Edit form
  const [editPerms, setEditPerms] = useState<Record<PermKey, boolean>>({
    perm_developers: false,
    perm_lands: false,
    perm_owners: false,
    perm_deals: false,
    perm_content: false,
    perm_ai: false,
    perm_audit_log: false,
  });

  const permLabels: Record<PermKey, { ar: string; en: string }> = {
    perm_developers: { ar: "إدارة المطورين", en: "Manage Developers" },
    perm_lands: { ar: "إدارة الأراضي", en: "Manage Lands" },
    perm_owners: { ar: "إدارة الملاك", en: "Manage Owners" },
    perm_deals: { ar: "الطلبات والصفقات", en: "Requests & Deals" },
    perm_content: { ar: "إدارة المحتوى", en: "Manage Content" },
    perm_ai: { ar: "المساعد الذكي", en: "AI Assistant" },
    perm_audit_log: { ar: "سجل العمليات", en: "Audit Log" },
  };

  const fetchMembers = async () => {
    const { data } = await supabase
      .from("admin_permissions")
      .select("*")
      .order("created_at", { ascending: true });
    setMembers((data as AdminPerm[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchMembers(); }, []);

  const handleAdd = async () => {
    if (!addForm.email || !addForm.password) return;
    setSaving(true);
    try {
      const res = await supabase.functions.invoke("create-owner", {
        body: {
          action: "create_supervisor",
          email: addForm.email,
          password: addForm.password,
          display_name: addForm.display_name,
          permissions: {
            perm_developers: addForm.perm_developers,
            perm_lands: addForm.perm_lands,
            perm_owners: addForm.perm_owners,
            perm_deals: addForm.perm_deals,
            perm_content: addForm.perm_content,
            perm_ai: addForm.perm_ai,
            perm_audit_log: addForm.perm_audit_log,
          },
        },
      });
      if (res.error || res.data?.error) throw new Error(res.data?.error || res.error?.message);
      if (user) await logAudit(user.id, user.email, "create", "supervisor", res.data?.user_id, { email: addForm.email });
      toast({ title: isAr ? "تمت إضافة المشرف" : "Supervisor added" });
      setAddOpen(false);
      setAddForm({ email: "", password: "", display_name: "", perm_developers: false, perm_lands: false, perm_owners: false, perm_deals: false, perm_content: false, perm_ai: false, perm_audit_log: false });
      fetchMembers();
    } catch (err: any) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: err.message });
    }
    setSaving(false);
  };

  const openEdit = (m: AdminPerm) => {
    setEditMember(m);
    setEditPerms({
      perm_developers: m.perm_developers,
      perm_lands: m.perm_lands,
      perm_owners: m.perm_owners,
      perm_deals: m.perm_deals,
      perm_content: m.perm_content,
      perm_ai: m.perm_ai,
      perm_audit_log: m.perm_audit_log,
    });
  };

  const saveEdit = async () => {
    if (!editMember) return;
    setSaving(true);
    const { error } = await supabase
      .from("admin_permissions")
      .update(editPerms)
      .eq("id", editMember.id);
    setSaving(false);
    if (error) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: error.message });
    } else {
      if (user) await logAudit(user.id, user.email, "update", "supervisor_permissions", editMember.id, editPerms);
      toast({ title: isAr ? "تم تحديث الصلاحيات" : "Permissions updated" });
      setEditMember(null);
      fetchMembers();
    }
  };

  const handleDelete = async () => {
    if (!deleteMember) return;
    setDeleting(true);
    try {
      await supabase.from("admin_permissions").delete().eq("id", deleteMember.id);
      await supabase.from("user_roles").delete().eq("user_id", deleteMember.user_id).eq("role", "admin");
      const res = await supabase.functions.invoke("create-owner", {
        body: { action: "delete_user", user_id: deleteMember.user_id },
      });
      if (res.error) console.warn("Auth delete warning:", res.error);
      if (user) await logAudit(user.id, user.email, "delete", "supervisor", deleteMember.id, { email: deleteMember.user_email });
      toast({ title: isAr ? "تم حذف المشرف" : "Supervisor deleted" });
      setDeleteMember(null);
      fetchMembers();
    } catch (err: any) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: err.message });
    }
    setDeleting(false);
  };

  const activePermCount = (m: AdminPerm) =>
    PERM_KEYS.filter((k) => m[k]).length;

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-foreground">{isAr ? "فريق الإدارة" : "Admin Team"}</h1>
          <p className="mt-1 text-sm font-light text-muted-foreground">
            {isAr ? "إضافة مشرفين وتحديد صلاحياتهم" : "Add supervisors and manage their permissions"}
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="doma-gradient gap-2">
          <Plus className="h-4 w-4" />
          {isAr ? "إضافة مشرف" : "Add Supervisor"}
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />)}</div>
      ) : members.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <p className="text-sm text-muted-foreground">{isAr ? "لم تتم إضافة مشرفين بعد" : "No supervisors added yet"}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {members.map((m) => (
            <div key={m.id} className="doma-card flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                  {m.is_super_admin ? (
                    <ShieldCheck className="h-5 w-5 text-primary" />
                  ) : (
                    <Shield className="h-5 w-5 text-accent-foreground" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{m.display_name || m.user_email}</p>
                    {m.is_super_admin && (
                      <Badge variant="default" className="text-[10px]">
                        {isAr ? "مدير رئيسي" : "Super Admin"}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs font-light text-muted-foreground" dir="ltr">{m.user_email}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {m.is_super_admin ? (
                      <Badge variant="outline" className="text-[10px]">{isAr ? "جميع الصلاحيات" : "Full Access"}</Badge>
                    ) : (
                      PERM_KEYS.filter((k) => m[k]).map((k) => (
                        <Badge key={k} variant="outline" className="text-[10px]">
                          {isAr ? permLabels[k].ar : permLabels[k].en}
                        </Badge>
                      ))
                    )}
                    {!m.is_super_admin && activePermCount(m) === 0 && (
                      <Badge variant="outline" className="text-[10px] text-destructive border-destructive/30">
                        {isAr ? "بدون صلاحيات" : "No permissions"}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              {!m.is_super_admin && (
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(m)}>
                    <Pencil className="h-3.5 w-3.5 me-1" />
                    {isAr ? "صلاحيات" : "Permissions"}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteMember(m)} className="text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Supervisor Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md" dir={isAr ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle>{isAr ? "إضافة مشرف جديد" : "Add New Supervisor"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-sm">{isAr ? "الاسم" : "Name"}</Label>
              <Input value={addForm.display_name} onChange={(e) => setAddForm((p) => ({ ...p, display_name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">{isAr ? "البريد الإلكتروني" : "Email"} <span className="text-destructive">*</span></Label>
              <Input type="email" dir="ltr" value={addForm.email} onChange={(e) => setAddForm((p) => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">{isAr ? "كلمة المرور" : "Password"} <span className="text-destructive">*</span></Label>
              <div className="relative">
                <Input
                  type={showAddPassword ? "text" : "password"}
                  dir="ltr"
                  value={addForm.password}
                  onChange={(e) => setAddForm((p) => ({ ...p, password: e.target.value }))}
                  className="pe-10"
                />
                <button type="button" onClick={() => setShowAddPassword(!showAddPassword)} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showAddPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-3 border-t border-border/40 pt-4">
              <Label className="text-sm font-medium">{isAr ? "الصلاحيات" : "Permissions"}</Label>
              <div className="space-y-2">
                {PERM_KEYS.map((k) => (
                  <label key={k} className="flex items-center gap-3 rounded-lg border border-border/40 px-3 py-2.5 cursor-pointer hover:bg-accent/30 transition-colors">
                    <Checkbox
                      checked={addForm[k]}
                      onCheckedChange={(c) => setAddForm((p) => ({ ...p, [k]: !!c }))}
                    />
                    <span className="text-sm">{isAr ? permLabels[k].ar : permLabels[k].en}</span>
                  </label>
                ))}
              </div>
              <button
                type="button"
                className="text-xs text-primary hover:underline"
                onClick={() => {
                  const allTrue = PERM_KEYS.every((k) => addForm[k]);
                  const val = !allTrue;
                  setAddForm((p) => {
                    const next = { ...p };
                    PERM_KEYS.forEach((k) => { next[k] = val; });
                    return next;
                  });
                }}
              >
                {isAr ? "تحديد / إلغاء الكل" : "Select / Deselect All"}
              </button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={handleAdd} disabled={saving || !addForm.email || !addForm.password}>
              {saving ? (isAr ? "جارٍ الإضافة..." : "Adding...") : (isAr ? "إضافة" : "Add")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Permissions Dialog */}
      <Dialog open={!!editMember} onOpenChange={(open) => !open && setEditMember(null)}>
        <DialogContent className="max-w-md" dir={isAr ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle>{isAr ? "تعديل صلاحيات" : "Edit Permissions"}: {editMember?.display_name || editMember?.user_email}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {PERM_KEYS.map((k) => (
              <label key={k} className="flex items-center gap-3 rounded-lg border border-border/40 px-3 py-2.5 cursor-pointer hover:bg-accent/30 transition-colors">
                <Checkbox
                  checked={editPerms[k]}
                  onCheckedChange={(c) => setEditPerms((p) => ({ ...p, [k]: !!c }))}
                />
                <span className="text-sm">{isAr ? permLabels[k].ar : permLabels[k].en}</span>
              </label>
            ))}
            <button
              type="button"
              className="text-xs text-primary hover:underline"
              onClick={() => {
                const allTrue = PERM_KEYS.every((k) => editPerms[k]);
                const val = !allTrue;
                setEditPerms((p) => {
                  const next = { ...p };
                  PERM_KEYS.forEach((k) => { next[k] = val; });
                  return next;
                });
              }}
            >
              {isAr ? "تحديد / إلغاء الكل" : "Select / Deselect All"}
            </button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditMember(null)}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={saveEdit} disabled={saving}>
              {saving ? (isAr ? "جارٍ الحفظ..." : "Saving...") : (isAr ? "حفظ" : "Save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteMember} onOpenChange={(open) => !open && setDeleteMember(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-destructive">{isAr ? "حذف المشرف" : "Delete Supervisor"}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {isAr
              ? `هل أنت متأكد من حذف "${deleteMember?.display_name || deleteMember?.user_email}"؟`
              : `Are you sure you want to delete "${deleteMember?.display_name || deleteMember?.user_email}"?`}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteMember(null)}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? (isAr ? "جارٍ الحذف..." : "Deleting...") : (isAr ? "حذف" : "Delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminTeam;
