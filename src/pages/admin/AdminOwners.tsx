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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Landmark, Mail, User, Eye, EyeOff, Copy, KeyRound, Pencil, Trash2 } from "lucide-react";

const AdminOwners: React.FC = () => {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const { toast } = useToast();
  const isAr = lang === "ar";
  usePageTitle(isAr ? "إدارة الملاك" : "Manage Owners");

  const [owners, setOwners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", password: "" });
  const [createdInfo, setCreatedInfo] = useState<{ email: string; password: string } | null>(null);

  // Password reset state
  const [passwordDialog, setPasswordDialog] = useState<{ owner_id: string; name: string } | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Delete state
  const [deleteDialog, setDeleteDialog] = useState<{ owner_id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchOwners = async () => {
    const { data: landsData } = await supabase
      .from("lands")
      .select("owner_id, owner_name, city, district, land_area_sqm, owner_approved")
      .order("created_at", { ascending: false });

    const ownerMap: Record<string, { owner_id: string; owner_name: string; lands: any[] }> = {};
    landsData?.forEach((l) => {
      if (!ownerMap[l.owner_id]) {
        ownerMap[l.owner_id] = { owner_id: l.owner_id, owner_name: l.owner_name || "", lands: [] };
      }
      ownerMap[l.owner_id].lands.push(l);
    });

    const ownerIds = Object.keys(ownerMap);
    if (ownerIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, email, full_name")
        .in("user_id", ownerIds);

      profiles?.forEach((p) => {
        if (ownerMap[p.user_id]) {
          ownerMap[p.user_id].owner_name = p.full_name || ownerMap[p.user_id].owner_name;
          (ownerMap[p.user_id] as any).email = p.email;
        }
      });
    }

    setOwners(Object.values(ownerMap));
    setLoading(false);
  };

  useEffect(() => { fetchOwners(); }, []);

  const handleCreate = async () => {
    if (!form.email || !form.password) return;
    setCreating(true);
    try {
      const res = await supabase.functions.invoke("create-owner", {
        body: { email: form.email, password: form.password, full_name: form.full_name },
      });
      if (res.error || res.data?.error) throw new Error(res.data?.error || res.error?.message);
      if (user) await logAudit(user.id, user.email, "create", "owner", undefined, { email: form.email });
      toast({ title: isAr ? "تم إنشاء حساب المالك" : "Owner account created" });
      setCreatedInfo({ email: form.email, password: form.password });
      setForm({ full_name: "", email: "", password: "" });
      fetchOwners();
    } catch (err: any) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: err.message });
    }
    setCreating(false);
  };

  const handleUpdatePassword = async () => {
    if (!passwordDialog || !newPassword) return;
    setUpdatingPassword(true);
    try {
      const res = await supabase.functions.invoke("create-owner", {
        body: { action: "update_password", user_id: passwordDialog.owner_id, new_password: newPassword },
      });
      if (res.error || res.data?.error) throw new Error(res.data?.error || res.error?.message);
      if (user) await logAudit(user.id, user.email, "reset_password", "owner", passwordDialog.owner_id);
      toast({ title: isAr ? "تم تحديث كلمة المرور" : "Password updated successfully" });
      setPasswordDialog(null);
      setNewPassword("");
    } catch (err: any) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: err.message });
    }
    setUpdatingPassword(false);
  };

  const handleDeleteOwner = async () => {
    if (!deleteDialog) return;
    setDeleting(true);
    try {
      const res = await supabase.functions.invoke("create-owner", {
        body: { action: "delete_user", user_id: deleteDialog.owner_id },
      });
      if (res.error || res.data?.error) throw new Error(res.data?.error || res.error?.message);
      if (user) await logAudit(user.id, user.email, "delete", "owner", deleteDialog.owner_id);
      toast({ title: isAr ? "تم حذف الحساب" : "Account deleted" });
      setDeleteDialog(null);
      fetchOwners();
    } catch (err: any) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: err.message });
    }
    setDeleting(false);
  };

  const copyCredentials = () => {
    if (!createdInfo) return;
    navigator.clipboard.writeText(`${isAr ? "البريد" : "Email"}: ${createdInfo.email}\n${isAr ? "كلمة المرور" : "Password"}: ${createdInfo.password}`);
    toast({ title: isAr ? "تم النسخ" : "Copied!" });
  };

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-foreground">{isAr ? "إدارة ملاك الأراضي" : "Manage Land Owners"}</h1>
          <p className="mt-1 text-sm font-light text-muted-foreground">
            {isAr ? "إنشاء حسابات الملاك وربطهم بأراضيهم" : "Create owner accounts and link them to their lands"}
          </p>
        </div>
        <Dialog open={showAdd} onOpenChange={(v) => { setShowAdd(v); if (!v) { setCreatedInfo(null); setForm({ full_name: "", email: "", password: "" }); } }}>
          <DialogTrigger asChild>
            <Button className="gap-2 doma-gradient"><Plus className="h-4 w-4" />{isAr ? "إضافة مالك" : "Add Owner"}</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{isAr ? "إنشاء حساب مالك أرض" : "Create Land Owner Account"}</DialogTitle>
            </DialogHeader>
            {createdInfo ? (
              <div className="space-y-4 py-4">
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 text-center">
                  <p className="text-sm font-medium text-emerald-700 mb-2">
                    {isAr ? "✅ تم إنشاء الحساب بنجاح" : "✅ Account created successfully"}
                  </p>
                  <div className="rounded-lg border border-border bg-muted/50 p-3 text-start space-y-1" dir="ltr">
                    <p className="text-sm"><span className="text-muted-foreground">Email:</span> {createdInfo.email}</p>
                    <p className="text-sm"><span className="text-muted-foreground">Password:</span> {createdInfo.password}</p>
                  </div>
                  <Button variant="outline" size="sm" className="mt-3 gap-2" onClick={copyCredentials}>
                    <Copy className="h-3.5 w-3.5" />{isAr ? "نسخ البيانات" : "Copy Credentials"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 py-4">
                <div>
                  <Label className="text-xs">{isAr ? "اسم المالك" : "Owner Name"}</Label>
                  <Input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">{isAr ? "البريد الإلكتروني" : "Email"}</Label>
                  <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} dir="ltr" />
                </div>
                <div>
                  <Label className="text-xs">{isAr ? "كلمة المرور" : "Password"}</Label>
                  <div className="relative">
                    <Input type={showPassword ? "text" : "password"} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} dir="ltr" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button className="w-full doma-gradient" onClick={handleCreate} disabled={creating || !form.email || !form.password}>
                  {creating ? (isAr ? "جاري الإنشاء..." : "Creating...") : (isAr ? "إنشاء الحساب" : "Create Account")}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[1, 2].map(i => <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />)}
        </div>
      ) : owners.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <Landmark className="mb-4 h-12 w-12 text-muted-foreground/30" strokeWidth={1} />
          <p className="text-sm font-light text-muted-foreground">
            {isAr ? "لا يوجد ملاك مسجلين حالياً" : "No owners registered yet"}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {owners.map((owner) => (
            <div key={owner.owner_id} className="doma-card p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{owner.owner_name || (isAr ? "بدون اسم" : "No name")}</p>
                    <p className="text-xs text-muted-foreground">{(owner as any).email || owner.owner_id.slice(0, 8)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => setPasswordDialog({ owner_id: owner.owner_id, name: owner.owner_name })}>
                    <KeyRound className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => setDeleteDialog({ owner_id: owner.owner_id, name: owner.owner_name })}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-1">
                {owner.lands.map((l: any, i: number) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-border/40 px-3 py-1.5">
                    <span className="text-xs font-light text-muted-foreground">
                      {l.city} {l.district ? `- ${l.district}` : ""} ({Number(l.land_area_sqm).toLocaleString()} {isAr ? "م²" : "sqm"})
                    </span>
                    {l.owner_approved && (
                      <span className="text-[10px] text-emerald-600">🟢 {isAr ? "معتمد" : "Approved"}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Password Reset Dialog */}
      <Dialog open={!!passwordDialog} onOpenChange={(open) => { if (!open) { setPasswordDialog(null); setNewPassword(""); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{isAr ? "تغيير كلمة المرور" : "Change Password"}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {isAr ? `تغيير كلمة مرور: ${passwordDialog?.name || ""}` : `Change password for: ${passwordDialog?.name || ""}`}
          </p>
          <div className="space-y-2">
            <Label className="text-xs">{isAr ? "كلمة المرور الجديدة" : "New Password"}</Label>
            <div className="relative">
              <Input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="••••••••"
                dir="ltr"
              />
              <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordDialog(null)}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={handleUpdatePassword} disabled={updatingPassword || newPassword.length < 6}>
              {updatingPassword ? (isAr ? "جارٍ التحديث..." : "Updating...") : (isAr ? "تحديث" : "Update")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteDialog} onOpenChange={(open) => !open && setDeleteDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-destructive">{isAr ? "حذف حساب المالك" : "Delete Owner Account"}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {isAr
              ? `هل أنت متأكد من حذف حساب "${deleteDialog?.name || ""}"؟ لا يمكن التراجع عن هذا الإجراء.`
              : `Are you sure you want to delete "${deleteDialog?.name || ""}"? This cannot be undone.`}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button variant="destructive" onClick={handleDeleteOwner} disabled={deleting}>
              {deleting ? (isAr ? "جارٍ الحذف..." : "Deleting...") : (isAr ? "حذف" : "Delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminOwners;
