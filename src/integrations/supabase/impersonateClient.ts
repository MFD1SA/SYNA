/**
 * Separate Supabase client for impersonation sessions.
 * Uses sessionStorage so the session is isolated to the current tab
 * and does NOT overwrite the admin's localStorage-based session.
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Key used to flag that this tab is an impersonation session
const IMPERSONATION_FLAG = "syna_impersonation_active";

export const impersonateClient = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: sessionStorage,
    storageKey: "syna-impersonate-session",
    persistSession: true,
    autoRefreshToken: true,
  },
});

/** Mark this tab as an impersonation session */
export const setImpersonationActive = () => {
  sessionStorage.setItem(IMPERSONATION_FLAG, "true");
};

/** Check if this tab is an impersonation session */
export const isImpersonationSession = (): boolean => {
  return sessionStorage.getItem(IMPERSONATION_FLAG) === "true";
};

/** Get the correct Supabase client for this tab */
export const getActiveClient = () => {
  if (isImpersonationSession()) {
    return impersonateClient;
  }
  // Dynamic import to avoid circular deps
  const { supabase } = require("./client");
  return supabase;
};
