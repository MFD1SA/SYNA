import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Landmark, Mail, User, Eye, EyeOff, Copy } from "lucide-react";

const AdminOwners: React.FC = () => {
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

  const fetchOwners = async () => {
    // Get all lands with distinct owner_ids that are not the admin
    const { data: landsData } = await supabase
      .from("lands")
      .select("owner_id, owner_name, city, district, land_area_sqm, owner_approved")
      .order("created_at", { ascending: false });

    // Group by owner_id
    const ownerMap: Record<string, { owner_id: string; owner_name: string; lands: any[] }> = {};
    landsData?.forEach((l) => {
      if (!ownerMap[l.owner_id]) {
        ownerMap[l.owner_id] = { owner_id: l.owner_id, owner_name: l.owner_name || "", lands: [] };
      }
      ownerMap[l.owner_id].lands.push(l);
    });

    // Also get profiles for owner emails
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
      const { data: session } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("create-owner", {
        body: { email: form.email, password: form.password, full_name: form.full_name },
      });

      if (res.error || res.data?.error) {
        throw new Error(res.data?.error || res.error?.message || "Unknown error");
      }

      toast({ title: isAr ? "تم إنشاء حساب المالك" : "Owner account created" });
      setCreatedInfo({ email: form.email, password: form.password });
      setForm({ full_name: "", email: "", password: "" });
      fetchOwners();
    } catch (err: any) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: err.message });
    }
    setCreating(false);
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
                  <p className="text-xs text-muted-foreground mb-3">
                    {isAr ? "أرسل بيانات الدخول للمالك:" : "Send these credentials to the owner:"}
                  </p>
                  <div className="rounded-lg border border-border bg-muted/50 p-3 text-start space-y-1" dir="ltr">
                    <p className="text-sm"><span className="text-muted-foreground">Email:</span> {createdInfo.email}</p>
                    <p className="text-sm"><span className="text-muted-foreground">Password:</span> {createdInfo.password}</p>
                  </div>
                  <Button variant="outline" size="sm" className="mt-3 gap-2" onClick={copyCredentials}>
                    <Copy className="h-3.5 w-3.5" />
                    {isAr ? "نسخ البيانات" : "Copy Credentials"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  {isAr
                    ? "الخطوة التالية: اذهب لـ إدارة الأراضي واربط الأرض بهذا المالك"
                    : "Next: Go to Manage Lands and link a land to this owner"}
                </p>
              </div>
            ) : (
              <div className="space-y-4 py-4">
                <div>
                  <Label className="text-xs">{isAr ? "اسم المالك" : "Owner Name"}</Label>
                  <Input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder={isAr ? "محمد عبدالله" : "John Doe"} />
                </div>
                <div>
                  <Label className="text-xs">{isAr ? "البريد الإلكتروني" : "Email"}</Label>
                  <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="owner@example.com" dir="ltr" />
                </div>
                <div>
                  <Label className="text-xs">{isAr ? "كلمة المرور" : "Password"}</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      placeholder="••••••••"
                      dir="ltr"
                    />
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
          <p className="text-xs text-muted-foreground mt-1">
            {isAr ? "أنشئ حساب مالك ثم اربطه بأرض من صفحة إدارة الأراضي" : "Create an owner account then link it to a land"}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {owners.map((owner) => (
            <div key={owner.owner_id} className="doma-card p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{owner.owner_name || (isAr ? "بدون اسم" : "No name")}</p>
                  <p className="text-xs text-muted-foreground">{(owner as any).email || owner.owner_id.slice(0, 8)}</p>
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
    </AdminLayout>
  );
};

export default AdminOwners;
