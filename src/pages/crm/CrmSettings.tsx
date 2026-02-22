import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useTenant } from "@/hooks/useTenant";
import CrmLayout from "@/components/crm/CrmLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Settings, Users, User } from "lucide-react";

const roleLabels: Record<string, { ar: string; en: string }> = {
  owner: { ar: "مالك", en: "Owner" },
  manager: { ar: "مدير", en: "Manager" },
  staff: { ar: "موظف", en: "Staff" },
  viewer: { ar: "مشاهد", en: "Viewer" },
};

const CrmSettings: React.FC = () => {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const { tenantId, tenantName, tenantRole } = useTenant();
  const { toast } = useToast();
  const [members, setMembers] = useState<any[]>([]);
  const [tenantData, setTenantData] = useState({ name: "", currency: "SAR", language: "ar" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) { setLoading(false); return; }
    const fetch = async () => {
      const [memRes, tenRes] = await Promise.all([
        supabase.from("tenant_members").select("*, profiles(full_name, email)").eq("tenant_id", tenantId),
        supabase.from("tenants").select("*").eq("id", tenantId).maybeSingle(),
      ]);
      setMembers(memRes.data || []);
      if (tenRes.data) setTenantData({ name: tenRes.data.name, currency: tenRes.data.currency, language: tenRes.data.language });
      setLoading(false);
    };
    fetch();
  }, [tenantId]);

  const handleSaveTenant = async () => {
    if (!tenantId) return;
    const { error } = await supabase.from("tenants").update(tenantData).eq("id", tenantId);
    if (error) toast({ variant: "destructive", title: "Error", description: error.message });
    else toast({ title: lang === "ar" ? "تم الحفظ" : "Saved" });
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    await supabase.from("tenant_members").update({ role: newRole as any }).eq("id", memberId);
    const { data } = await supabase.from("tenant_members").select("*, profiles(full_name, email)").eq("tenant_id", tenantId!);
    setMembers(data || []);
  };

  const isOwner = tenantRole === "owner";

  return (
    <CrmLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-foreground">{t.crm.nav.settings}</h1>
        <p className="mt-1 text-sm font-light text-muted-foreground">
          {lang === "ar" ? "إعدادات المنشأة والفريق" : "Organization and team settings"}
        </p>
      </div>

      {loading ? (
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Organization Settings */}
          <div className="doma-card p-6">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-medium text-foreground">
              <Settings className="h-4 w-4 text-primary" strokeWidth={1.5} />
              {t.crm.settings.preferences}
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t.crm.settings.companyName}</Label>
                <Input value={tenantData.name} onChange={(e) => setTenantData({ ...tenantData, name: e.target.value })} disabled={!isOwner} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t.crm.settings.currency}</Label>
                  <Select value={tenantData.currency} onValueChange={(v) => setTenantData({ ...tenantData, currency: v })} disabled={!isOwner}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SAR">SAR</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="AED">AED</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t.crm.settings.language}</Label>
                  <Select value={tenantData.language} onValueChange={(v) => setTenantData({ ...tenantData, language: v })} disabled={!isOwner}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ar">العربية</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {isOwner && (
                <Button onClick={handleSaveTenant} className="doma-gradient">{t.crm.actions.save}</Button>
              )}
            </div>
          </div>

          {/* Team Members */}
          <div className="doma-card p-6">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-medium text-foreground">
              <Users className="h-4 w-4 text-primary" strokeWidth={1.5} />
              {t.crm.settings.teamMembers}
              <span className="ms-auto text-xs font-light text-muted-foreground" dir="ltr">
                {members.length}
              </span>
            </h3>
            <div className="space-y-3">
              {members.map((m) => (
                <div key={m.id} className="flex items-center justify-between rounded-lg border border-border/40 p-3">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                    <div>
                      <p className="text-sm font-light text-foreground">
                        {(m as any).profiles?.full_name || (m as any).profiles?.email || m.user_id.slice(0, 8)}
                      </p>
                      <p className="text-xs font-light text-muted-foreground">{(m as any).profiles?.email}</p>
                    </div>
                  </div>
                  {isOwner && m.user_id !== user?.id ? (
                    <Select value={m.role} onValueChange={(v) => handleRoleChange(m.id, v)}>
                      <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(roleLabels).map(([value, labels]) => (
                          <SelectItem key={value} value={value}>{lang === "ar" ? labels.ar : labels.en}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs text-primary">
                      {lang === "ar" ? roleLabels[m.role]?.ar : roleLabels[m.role]?.en}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </CrmLayout>
  );
};

export default CrmSettings;
