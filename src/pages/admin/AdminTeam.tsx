import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { logAudit } from "@/lib/auditLog";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Users, Plus, Pencil, Trash2, ShieldCheck, Shield, Eye, EyeOff,
  Loader2, User, Mail, KeyRound, HardHat, Landmark, Handshake,
  FileText, Bot, ClipboardList, Building2
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
  "perm_developers", "perm_lands", "perm_owners", "perm_deals", "perm_content", "perm_ai", "perm_audit_log",
] as const;
type PermKey = typeof PERM_KEYS[number];

const permConfig: Record<PermKey, { ar: string; en: string; icon: React.ElementType; color: string }> = {
  perm_developers: { ar: "المطورين", en: "Developers", icon: HardHat, color: "text-blue-600" },
  perm_lands: { ar: "الأراضي", en: "Lands", icon: Landmark, color: "text-emerald-600" },
  perm_owners: { ar: "الملاك", en: "Owners", icon: Building2, color: "text-amber-600" },
  perm_deals: { ar: "الصفقات", en: "Deals", icon: Handshake, color: "text-violet-600" },
  perm_content: { ar: "المحتوى", en: "Content", icon: FileText, color: "text-cyan-600" },
  perm_ai: { ar: "الذكاء الاصطناعي", en: "AI", icon: Bot, color: "text-pink-600" },
  perm_audit_log: { ar: "سجل العمليات", en: "Audit Log", icon: ClipboardList, color: "text-orange-600" },
};

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

  const [addForm, setAddForm] = useState({
    email: "", password: "", display_name: "",
    perm_developers: false, perm_lands: false, perm_owners: false, perm_deals: false,
    perm_content: false, perm_ai: false, perm_audit_log: false,
  });
  const [showAddPassword, setShowAddPassword] = useState(false);

  const [editPerms, setEditPerms] = useState<Record<PermKey, boolean>>({
    perm_developers: false, perm_lands: false, perm_owners: false, perm_deals: false,
    perm_content: false, perm_ai: false, perm_audit_log: false,
  });

  // Password change for supervisors
  const [passwordDialog, setPasswordDialog] = useState<AdminPerm | null>(null);
  const [supervisorNewPassword, setSupervisorNewPassword] = useState("");
  const [showSupervisorPassword, setShowSupervisorPassword] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const fetchMembers = async () => {
    const { data } = await supabase.from("admin_permissions").select("*").order("created_at", { ascending: true });
    setMembers((data as AdminPerm[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchMembers(); }, []);

  const handleAdd = async () => {
    if (!addForm.email || !addForm.password || !addForm.display_name) return;
    setSaving(true);
    try {
      const res = await supabase.functions.invoke("create-owner", {
        body: {
          action: "create_supervisor", email: addForm.email, password: addForm.password,
          display_name: addForm.display_name,
          permissions: Object.fromEntries(PERM_KEYS.map(k => [k, addForm[k]])),
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
    setEditPerms(Object.fromEntries(PERM_KEYS.map(k => [k, m[k]])) as Record<PermKey, boolean>);
  };

  const saveEdit = async () => {
    if (!editMember) return;
    setSaving(true);
    const { error } = await supabase.from("admin_permissions").update(editPerms).eq("id", editMember.id);
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

  const handleUpdateSupervisorPassword = async () => {
    if (!passwordDialog || !supervisorNewPassword) return;
    setUpdatingPassword(true);
    try {
      const res = await supabase.functions.invoke("create-owner", {
        body: { action: "update_password", user_id: passwordDialog.user_id, new_password: supervisorNewPassword },
      });
      if (res.error || res.data?.error) throw new Error(res.data?.error || res.error?.message);
      if (user) await logAudit(user.id, user.email, "reset_password", "supervisor", passwordDialog.id);
      toast({ title: isAr ? "تم تحديث كلمة المرور" : "Password updated" });
      setPasswordDialog(null);
      setSupervisorNewPassword("");
    } catch (err: any) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: err.message });
    }
    setUpdatingPassword(false);
  };

  const activePermCount = (m: AdminPerm) => PERM_KEYS.filter(k => m[k]).length;

  return (
    <AdminLayout>
      <div dir={isAr ? "rtl" : "ltr"}>
        <AdminPageHeader
          icon={Users}
          titleAr="فريق الإدارة"
          titleEn="Admin Team"
          descAr="إضافة مشرفين وتحديد صلاحياتهم بدقة"
          descEn="Add supervisors and manage permissions precisely"
          actions={
            <Button onClick={() => setAddOpen(true)} className="gap-2 bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4" />{isAr ? "إضافة مشرف" : "Add Supervisor"}
            </Button>
          }
        />

        {loading ? (
          <div className="space-y-3">{[1, 2].map(i => <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />)}</div>
        ) : members.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Users className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-sm text-muted-foreground">{isAr ? "لم تتم إضافة مشرفين بعد" : "No supervisors added yet"}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((m) => (
              <div key={m.id} className="rounded-xl border border-border/60 bg-card p-4 hover:border-primary/20 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${m.is_super_admin ? "bg-primary/10" : "bg-muted"} shrink-0`}>
                      {m.is_super_admin ? <ShieldCheck className="h-5 w-5 text-primary" /> : <Shield className="h-5 w-5 text-muted-foreground" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-foreground">{m.display_name || m.user_email}</p>
                        {m.is_super_admin && (
                          <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">{isAr ? "مدير رئيسي" : "Super Admin"}</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground" dir="ltr">{m.user_email}</p>
                    </div>
                  </div>
                  {!m.is_super_admin && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => setPasswordDialog(m)}>
                        <KeyRound className="h-3 w-3" />{isAr ? "كلمة المرور" : "Password"}
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => openEdit(m)}>
                        <Pencil className="h-3 w-3" />{isAr ? "صلاحيات" : "Permissions"}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => setDeleteMember(m)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                {/* Permissions Grid - Horizontal */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {m.is_super_admin ? (
                    <Badge variant="outline" className="text-[10px] gap-1 text-emerald-600 border-emerald-500/30">
                      <ShieldCheck className="h-3 w-3" />{isAr ? "جميع الصلاحيات" : "Full Access"}
                    </Badge>
                  ) : (
                    PERM_KEYS.map(k => {
                      const pc = permConfig[k];
                      const PermIcon = pc.icon;
                      return (
                        <Badge key={k} variant="outline" className={`text-[10px] gap-1 ${m[k] ? `${pc.color} border-current/20` : "text-muted-foreground/40 line-through"}`}>
                          <PermIcon className="h-3 w-3" />
                          {isAr ? pc.ar : pc.en}
                        </Badge>
                      );
                    })
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Supervisor Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-xl" dir={isAr ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              {isAr ? "إضافة مشرف جديد" : "Add New Supervisor"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Personal Info - Horizontal */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">{isAr ? "الاسم الكامل" : "Full Name"} <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <User className="absolute start-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input className="ps-9" value={addForm.display_name} onChange={e => setAddForm(p => ({ ...p, display_name: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">{isAr ? "البريد" : "Email"} <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Mail className="absolute start-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input className="ps-9" type="email" dir="ltr" value={addForm.email} onChange={e => setAddForm(p => ({ ...p, email: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">{isAr ? "كلمة المرور" : "Password"} <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <KeyRound className="absolute start-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input className="ps-9 pe-10" type={showAddPassword ? "text" : "password"} dir="ltr" value={addForm.password} onChange={e => setAddForm(p => ({ ...p, password: e.target.value }))} />
                  <button type="button" onClick={() => setShowAddPassword(!showAddPassword)} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showAddPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Permissions Grid - Horizontal */}
            <div className="border-t border-border/40 pt-4">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-medium">{isAr ? "الصلاحيات" : "Permissions"}</Label>
                <button type="button" className="text-xs text-primary hover:underline" onClick={() => {
                  const allTrue = PERM_KEYS.every(k => addForm[k]);
                  setAddForm(p => { const next = { ...p }; PERM_KEYS.forEach(k => { next[k] = !allTrue; }); return next; });
                }}>
                  {isAr ? "تحديد / إلغاء الكل" : "Toggle All"}
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PERM_KEYS.map(k => {
                  const pc = permConfig[k];
                  const PermIcon = pc.icon;
                  return (
                    <label key={k} className={`flex items-center gap-2.5 rounded-xl border p-3 cursor-pointer transition-all ${addForm[k] ? "border-primary/30 bg-primary/5" : "border-border/40 hover:bg-muted/30"}`}>
                      <Switch checked={addForm[k]} onCheckedChange={c => setAddForm(p => ({ ...p, [k]: c }))} className="scale-75" />
                      <PermIcon className={`h-4 w-4 ${addForm[k] ? pc.color : "text-muted-foreground/50"}`} />
                      <span className={`text-xs ${addForm[k] ? "font-medium text-foreground" : "text-muted-foreground"}`}>{isAr ? pc.ar : pc.en}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAddOpen(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={handleAdd} disabled={saving || !addForm.email || !addForm.password || !addForm.display_name} className="gap-1.5 bg-primary hover:bg-primary/90">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              {saving ? (isAr ? "جارٍ الإضافة..." : "Adding...") : (isAr ? "إضافة المشرف" : "Add Supervisor")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Permissions Dialog */}
      <Dialog open={!!editMember} onOpenChange={open => !open && setEditMember(null)}>
        <DialogContent className="sm:max-w-lg" dir={isAr ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              {isAr ? "تعديل صلاحيات" : "Edit Permissions"}: {editMember?.display_name || editMember?.user_email}
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground">{activePermCount(editMember || {} as AdminPerm)}/{PERM_KEYS.length} {isAr ? "مُفعّلة" : "enabled"}</span>
              <button type="button" className="text-xs text-primary hover:underline" onClick={() => {
                const allTrue = PERM_KEYS.every(k => editPerms[k]);
                setEditPerms(p => { const next = { ...p }; PERM_KEYS.forEach(k => { next[k] = !allTrue; }); return next; });
              }}>
                {isAr ? "تحديد / إلغاء الكل" : "Toggle All"}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {PERM_KEYS.map(k => {
                const pc = permConfig[k];
                const PermIcon = pc.icon;
                return (
                  <label key={k} className={`flex items-center gap-2.5 rounded-xl border p-3 cursor-pointer transition-all ${editPerms[k] ? "border-primary/30 bg-primary/5" : "border-border/40 hover:bg-muted/30"}`}>
                    <Switch checked={editPerms[k]} onCheckedChange={c => setEditPerms(p => ({ ...p, [k]: c }))} className="scale-75" />
                    <PermIcon className={`h-4 w-4 ${editPerms[k] ? pc.color : "text-muted-foreground/50"}`} />
                    <span className={`text-xs ${editPerms[k] ? "font-medium text-foreground" : "text-muted-foreground"}`}>{isAr ? pc.ar : pc.en}</span>
                  </label>
                );
              })}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditMember(null)}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={saveEdit} disabled={saving} className="gap-1.5">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
              {saving ? (isAr ? "جارٍ الحفظ..." : "Saving...") : (isAr ? "حفظ الصلاحيات" : "Save Permissions")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Change Dialog */}
      <Dialog open={!!passwordDialog} onOpenChange={open => { if (!open) { setPasswordDialog(null); setSupervisorNewPassword(""); } }}>
        <DialogContent className="max-w-sm" dir={isAr ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              {isAr ? "تغيير كلمة المرور" : "Change Password"}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{passwordDialog?.display_name || passwordDialog?.user_email}</p>
          <div className="space-y-1.5">
            <Label className="text-xs">{isAr ? "كلمة المرور الجديدة" : "New Password"}</Label>
            <div className="relative">
              <Input type={showSupervisorPassword ? "text" : "password"} value={supervisorNewPassword} onChange={e => setSupervisorNewPassword(e.target.value)} dir="ltr" className="pe-10" />
              <button type="button" onClick={() => setShowSupervisorPassword(!showSupervisorPassword)} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showSupervisorPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPasswordDialog(null)}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={handleUpdateSupervisorPassword} disabled={updatingPassword || supervisorNewPassword.length < 6} className="gap-1.5">
              {updatingPassword ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <KeyRound className="h-3.5 w-3.5" />}
              {isAr ? "تحديث" : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteMember} onOpenChange={open => !open && setDeleteMember(null)}>
        <DialogContent className="max-w-sm" dir={isAr ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" />{isAr ? "حذف المشرف" : "Delete Supervisor"}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {isAr
              ? `هل أنت متأكد من حذف "${deleteMember?.display_name || deleteMember?.user_email}"؟`
              : `Are you sure you want to delete "${deleteMember?.display_name || deleteMember?.user_email}"?`}
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteMember(null)}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting} className="gap-1.5">
              {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              {deleting ? (isAr ? "جارٍ الحذف..." : "Deleting...") : (isAr ? "حذف" : "Delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminTeam;
