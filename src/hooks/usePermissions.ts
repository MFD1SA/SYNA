import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type UserRole = "admin" | "user" | "viewer";

interface Permissions {
  role: UserRole;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canViewAll: boolean;
  loading: boolean;
}

export const usePermissions = (): Permissions => {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole>("user");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRole("user");
      setLoading(false);
      return;
    }

    const fetchRole = async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      setRole((data?.role as UserRole) ?? "user");
      setLoading(false);
    };

    fetchRole();
  }, [user]);

  return {
    role,
    canCreate: role !== "viewer",
    canEdit: role !== "viewer",
    canDelete: role !== "viewer",
    canViewAll: role === "admin",
    loading,
  };
};
