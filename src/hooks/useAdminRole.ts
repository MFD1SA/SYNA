import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useAdminRole = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const checkedUserId = useRef<string | null>(null);

  useEffect(() => {
    const userId = user?.id ?? null;

    if (!userId) {
      setIsAdmin(false);
      setLoading(false);
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
      setLoading(false);
    };

    checkRole();
  }, [user?.id]);

  return { isAdmin, loading };
};
