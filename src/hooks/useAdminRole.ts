import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useAdminRole = () => {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [roleChecked, setRoleChecked] = useState(false);
  const checkedUserId = useRef<string | null>(null);

  useEffect(() => {
    // Wait until auth is done loading before making any decisions
    if (authLoading) return;

    const userId = user?.id ?? null;

    if (!userId) {
      setIsAdmin(false);
      setRoleChecked(true);
      checkedUserId.current = null;
      return;
    }

    // Skip re-check if we already verified this user
    if (checkedUserId.current === userId) return;

    const checkRole = async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();

      checkedUserId.current = userId;
      setIsAdmin(!!data);
      setRoleChecked(true);
    };

    checkRole();
  }, [user?.id, authLoading]);

  // Loading is true until auth finishes AND role check completes
  const loading = authLoading || !roleChecked;

  return { isAdmin, loading };
};
