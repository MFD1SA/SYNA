import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { clearUserTypeCache } from "@/hooks/useUserType";
import { setSentryUser } from "@/lib/sentry";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Kept for backwards compatibility with login screens that call it.
 * No longer strictly needed because impersonation tabs now use sessionStorage
 * (see client.ts), so there is no cross-tab interference to worry about.
 */
export const notifyLocalAuthChange = () => {
  // no-op — kept as a stable export for callers
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    // Initial session load with retry for transient network failures.
    const loadSession = async (attempt = 0): Promise<void> => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (cancelled) return;
        if (error && attempt < 2) {
          // Back off and retry for recoverable errors
          await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
          return loadSession(attempt + 1);
        }
        setSession(data.session);
        setUser(data.session?.user ?? null);
        setSentryUser(data.session?.user?.id ?? null);
        setLoading(false);
      } catch {
        if (cancelled) return;
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
          return loadSession(attempt + 1);
        }
        setLoading(false);
      }
    };
    loadSession();

    // Handle TOKEN_REFRESHED + SIGNED_IN + SIGNED_OUT correctly.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (cancelled) return;
      if (event === "SIGNED_OUT" || !newSession) {
        // Belt-and-braces: even if signOut() was not called through our
        // wrapper (e.g. session expired on the server, or a sibling tab
        // triggered the event), wipe the role cache so the next useUserType
        // consumer doesn't see a stale admin verdict for a signed-out user.
        clearUserTypeCache();
        setSession(null);
        setUser(null);
        setSentryUser(null);
      } else {
        // SIGNED_IN, TOKEN_REFRESHED, USER_UPDATED — always reflect new state
        setSession(newSession);
        setUser(newSession.user);
        setSentryUser(newSession.user.id);
      }
      setLoading(false);
    });

    // Cross-tab signOut propagation: Supabase v2 writes to localStorage,
    // so a sign-out in tab A drops the session key. Tab B's
    // onAuthStateChange fires only on next refresh attempt; listen for
    // the storage event directly so tab B reacts immediately.
    const onStorage = (e: StorageEvent) => {
      if (cancelled) return;
      // Supabase's storage key is prefixed `sb-...-auth-token` — match the
      // removal of any auth-token key, or the explicit clear of our
      // impersonation flag.
      if (
        e.storageArea === localStorage &&
        e.newValue === null &&
        (e.key?.includes("auth-token") || e.key?.includes("syna-auth"))
      ) {
        clearUserTypeCache();
        setSession(null);
        setUser(null);
        setSentryUser(null);
      }
    };
    window.addEventListener("storage", onStorage);

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  // useCallback so consumers (e.g. PublicOnlyRoute's useEffect) get a stable
  // function identity across renders — otherwise a dependency on signOut in
  // a useEffect would retrigger on every render of AuthProvider.
  const signOut = useCallback(async () => {
    // Tab-scoped impersonation cleanup. sessionStorage is per-tab so
    // clearing here affects ONLY this tab — admin tabs in other windows
    // are untouched. If we don't clear these, the next page load in this
    // tab will still be treated as an impersonation session (see
    // client.ts) and the stale marker survives the auth signOut.
    try {
      sessionStorage.removeItem("syna_impersonation_active");
      sessionStorage.removeItem("syna-impersonate-session");
      // Legacy cross-tab bridge — cleared just in case it leaked into
      // localStorage from an older build.
      localStorage.removeItem("syna_impersonate_tokens");
    } catch {
      /* storage may be unavailable in some sandboxes — non-fatal */
    }
    // Sign out first so any in-flight queries observe the invalidated
    // session; THEN wipe the role cache. Clearing the cache before
    // signOut() returns created a brief window where still-mounted
    // components re-read useUserType with the cleared cache and fired
    // fresh `user_roles` queries against the soon-to-be-invalid JWT.
    // Also clear Sentry scope before the listener sees SIGNED_OUT so any
    // error captured during the signOut roundtrip isn't tagged to the
    // previous user.
    setSentryUser(null);
    await supabase.auth.signOut();
    clearUserTypeCache();
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
