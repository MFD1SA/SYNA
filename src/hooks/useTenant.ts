import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface TenantInfo {
  tenantId: string | null;
  tenantName: string | null;
  tenantRole: string | null;
  loading: boolean;
}

export const useTenant = (): TenantInfo => {
  const { user } = useAuth();
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [tenantName, setTenantName] = useState<string | null>(null);
  const [tenantRole, setTenantRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchTenant = async () => {
      const { data: membership } = await supabase
        .from("tenant_members")
        .select("tenant_id, role")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (membership) {
        setTenantId(membership.tenant_id);
        setTenantRole(membership.role);

        const { data: tenant } = await supabase
          .from("tenants")
          .select("name")
          .eq("id", membership.tenant_id)
          .maybeSingle();

        setTenantName(tenant?.name ?? null);
      }
      setLoading(false);
    };

    fetchTenant();
  }, [user]);

  return { tenantId, tenantName, tenantRole, loading };
};
