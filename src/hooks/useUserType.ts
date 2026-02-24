import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type UserType = "admin" | "developer" | "owner" | "none" | "loading";

interface UserTypeResult {
  userType: UserType;
  loading: boolean;
  isDeveloper: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  developerId: string | null;
}

export const useUserType = (): UserTypeResult => {
  const { user } = useAuth();
  const [userType, setUserType] = useState<UserType>("loading");
  const [developerId, setDeveloperId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const checkedUserId = useRef<string | null>(null);

  useEffect(() => {
    const userId = user?.id ?? null;

    if (!userId) {
      setUserType("none");
      setDeveloperId(null);
      setLoading(false);
      checkedUserId.current = null;
      return;
    }

    // Skip re-check if we already verified this user
    if (checkedUserId.current === userId) return;

    // Reset loading when user changes to prevent premature redirect
    setLoading(true);
    setUserType("loading");

    const checkUserType = async () => {
      try {
        // Check all three in parallel for speed
        const [adminRes, devRes, landsRes] = await Promise.all([
          supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", userId)
            .eq("role", "admin")
            .maybeSingle(),
          supabase
            .from("developers")
            .select("id")
            .eq("user_id", userId)
            .maybeSingle(),
          supabase
            .from("lands")
            .select("id")
            .eq("owner_id", userId)
            .limit(1),
        ]);

        checkedUserId.current = userId;

        // Priority: admin > developer > owner > none
        if (adminRes.data) {
          setUserType("admin");
          setDeveloperId(null);
        } else if (devRes.data) {
          setUserType("developer");
          setDeveloperId(devRes.data.id);
        } else if (landsRes.data && landsRes.data.length > 0) {
          setUserType("owner");
          setDeveloperId(null);
        } else {
          setUserType("none");
          setDeveloperId(null);
        }
      } catch (err) {
        console.error("useUserType error:", err);
        setUserType("none");
      } finally {
        setLoading(false);
      }
    };

    checkUserType();
  }, [user?.id]);

  return {
    userType,
    loading,
    isDeveloper: userType === "developer",
    isOwner: userType === "owner",
    isAdmin: userType === "admin",
    developerId,
  };
};
