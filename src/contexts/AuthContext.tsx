import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { clearUserTypeCache } from "@/hooks/useUserType";
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
        setSession(null);
        setUser(null);
      } else {
        // SIGNED_IN, TOKEN_REFRESHED, USER_UPDATED — always reflect new state
        setSession(newSession);
        setUser(newSession.user);
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    clearUserTypeCache();
    await supabase.auth.signOut();
  };

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
