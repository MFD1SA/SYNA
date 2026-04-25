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

    // CRITICAL: user identity changed — reset flags to loading/false BEFORE the
    // async query so no render in the gap sees stale `{isAdmin: true}` against
    // the new user. Without this reset, AdminRoute would briefly allow a
    // non-admin into /admincp/* because `isAdmin` and `roleChecked` still
    // reflect the previous logged-in admin.
    setRoleChecked(false);
    setIsAdmin(false);

    let cancelled = false;

    const checkRole = async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();

      // Drop result if user changed again before the query resolved.
      if (cancelled) return;

      // On an RLS/network failure, surface the non-admin result but do NOT
      // cache the user id — next render will retry. Caching on error would
      // lock the user out until a hard refresh.
      if (error) {
        setIsAdmin(false);
        setRoleChecked(true);
        return;
      }

      checkedUserId.current = userId;
      setIsAdmin(!!data);
      setRoleChecked(true);
    };

    checkRole();

    return () => {
      cancelled = true;
    };
  }, [user?.id, authLoading]);

  // Loading is true until auth finishes AND role check completes
  const loading = authLoading || !roleChecked;

  return { isAdmin, loading };
};
