import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface UserProfile {
  fullName: string;
  email: string;
  initial: string;
  avatarUrl: string | null;
  loading: boolean;
}

/**
 * Fetches the current user's display name and avatar from the profiles table.
 * Uses user_metadata.full_name as immediate fallback (available from session)
 * so the name appears instantly without flashing the email first.
 */
export function useUserProfile(): UserProfile {
  const { user } = useAuth();

  // Immediate name from session metadata (no DB query needed)
  const metaName = user?.user_metadata?.full_name as string | undefined;

  const [fullName, setFullName] = useState(metaName || "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let cancelled = false;

    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!cancelled) {
        if (data?.full_name) setFullName(data.full_name);
        if ((data as any)?.avatar_url) setAvatarUrl((data as any).avatar_url);
        setLoading(false);
      }
    };
    fetchProfile();

    return () => { cancelled = true; };
  }, [user]);

  // Update if metadata changes (e.g. after re-auth)
  useEffect(() => {
    if (metaName && !fullName) setFullName(metaName);
  }, [metaName]);

  const email = user?.email || "";
  const displayName = fullName || email;
  const initial = (displayName[0] || "U").toUpperCase();

  return { fullName: displayName, email, initial, avatarUrl, loading };
}
