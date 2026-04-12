import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface UserProfile {
  fullName: string;
  email: string;
  initial: string;
}

/**
 * Fetches the current user's display name from the profiles table.
 * Falls back to email if no profile / full_name exists.
 */
export function useUserProfile(): UserProfile {
  const { user } = useAuth();
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const fetch = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!cancelled && data?.full_name) {
        setFullName(data.full_name);
      }
    };
    fetch();

    return () => { cancelled = true; };
  }, [user]);

  const email = user?.email || "";
  const displayName = fullName || email;
  const initial = (displayName[0] || "U").toUpperCase();

  return { fullName: displayName, email, initial };
}
