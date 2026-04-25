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

// ── Module-level cache ──────────────────────────────────────────────
// Prevents re-querying on every route change (e.g. DeveloperRoute remount).
// This eliminates the "flicker" when navigating between CRM pages.
let _cachedUserId: string | null = null;
let _cachedUserType: UserType = "loading";
let _cachedDeveloperId: string | null = null;
let _cacheReady = false;

export const useUserType = (): UserTypeResult => {
  const { user, loading: authLoading } = useAuth();
  const [userType, setUserType] = useState<UserType>(
    _cacheReady && _cachedUserId === (user?.id ?? null) ? _cachedUserType : "loading",
  );
  const [developerId, setDeveloperId] = useState<string | null>(
    _cacheReady && _cachedUserId === (user?.id ?? null) ? _cachedDeveloperId : null,
  );
  const [typeChecked, setTypeChecked] = useState(
    _cacheReady && _cachedUserId === (user?.id ?? null),
  );
  const fetchingRef = useRef(false);

  // Detect user change before effect runs — keeps `loading` true.
  // CRITICAL: we must recheck whenever the cache is for a DIFFERENT user
  // regardless of `_cacheReady`. The previous `&& !_cacheReady` clause meant
  // that after user A populated the cache, a switch to user B would briefly
  // return `{loading: false, userType: "A's type"}` for one render — enough
  // for DeveloperRoute/OwnerRoute to render the wrong dashboard frame.
  const needsRecheck = !!user?.id && _cachedUserId !== user.id;
  const loading = authLoading || !typeChecked || needsRecheck;

  useEffect(() => {
    if (authLoading) return;

    const userId = user?.id ?? null;

    if (!userId) {
      _cachedUserId = null;
      _cachedUserType = "none";
      _cachedDeveloperId = null;
      _cacheReady = true;
      setUserType("none");
      setDeveloperId(null);
      setTypeChecked(true);
      return;
    }

    // Use cache if available for this user
    if (_cacheReady && _cachedUserId === userId) {
      setUserType(_cachedUserType);
      setDeveloperId(_cachedDeveloperId);
      setTypeChecked(true);
      return;
    }

    // Prevent duplicate fetches
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    setTypeChecked(false);
    setUserType("loading");

    const checkUserType = async () => {
      try {
        const [rolesRes, devRes] = await Promise.all([
          supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", userId),
          supabase
            .from("developers")
            .select("id")
            .eq("user_id", userId)
            .maybeSingle(),
        ]);

        const roles = (rolesRes.data || []).map((r: any) => r.role);
        const isAdmin = roles.includes("admin");
        const isOwnerRole = roles.includes("owner");

        let resolvedType: UserType = "none";
        let resolvedDevId: string | null = null;

        if (isAdmin) {
          resolvedType = "admin";
        } else if (devRes.data) {
          resolvedType = "developer";
          resolvedDevId = devRes.data.id;
        } else if (isOwnerRole) {
          resolvedType = "owner";
        }

        // Write to module cache
        _cachedUserId = userId;
        _cachedUserType = resolvedType;
        _cachedDeveloperId = resolvedDevId;
        _cacheReady = true;

        setUserType(resolvedType);
        setDeveloperId(resolvedDevId);
      } catch (err) {
        console.error("useUserType error:", err);
        // Do NOT cache a "none" verdict on error. Transient RLS/network
        // failures would otherwise demote an admin/developer/owner to
        // "none" and stick there until a hard refresh.
        setUserType("none");
      } finally {
        setTypeChecked(true);
        fetchingRef.current = false;
      }
    };

    checkUserType();
  }, [user?.id, authLoading]);

  return {
    userType,
    loading,
    isDeveloper: userType === "developer",
    isOwner: userType === "owner",
    isAdmin: userType === "admin",
    developerId,
  };
};

// Call this on sign-out to clear the cache
export const clearUserTypeCache = () => {
  _cachedUserId = null;
  _cachedUserType = "loading";
  _cachedDeveloperId = null;
  _cacheReady = false;
};
