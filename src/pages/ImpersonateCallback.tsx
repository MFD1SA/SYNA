/**
 * ImpersonateCallback — Landing page for admin impersonation.
 *
 * The regular `supabase` client auto-detects impersonation tabs at
 * module-load time and uses sessionStorage (not localStorage) for them.
 * So setting the session here ONLY affects this tab — the admin's
 * localStorage session is never touched.
 */
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { setImpersonationActive } from "@/integrations/supabase/impersonateClient";

const TOKENS_KEY = "syna_impersonate_tokens";

const ImpersonateCallback: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processTokens = async () => {
      try {
        // Tokens are passed through the URL hash (#t=...) — hashes are never
        // sent to any server. Consume + wipe immediately.
        const hash = window.location.hash;
        let raw: string | null = null;
        if (hash.startsWith("#t=")) {
          try {
            raw = atob(decodeURIComponent(hash.slice(3)));
          } catch {
            raw = null;
          }
          // Clear hash from URL and browser history
          history.replaceState(null, "", window.location.pathname + window.location.search);
        }
        // Legacy fallback (older admin clients may still write to localStorage)
        if (!raw) {
          raw = localStorage.getItem(TOKENS_KEY);
          localStorage.removeItem(TOKENS_KEY);
        }

        if (!raw) {
          setError("No impersonation tokens found");
          return;
        }

        let tokens: { access_token: string; refresh_token: string };
        try {
          tokens = JSON.parse(raw);
        } catch {
          setError("Invalid token data");
          return;
        }

        if (!tokens.access_token || !tokens.refresh_token) {
          setError("Missing access_token or refresh_token");
          return;
        }

        // Ensure the impersonation flag is set (module-level code in client.ts
        // already sets it, but this is defence in depth).
        setImpersonationActive();

        // Establish session on the regular supabase client. Because this tab
        // was detected as an impersonation tab at module load, the client is
        // already configured to use sessionStorage — so this does NOT touch
        // the admin's localStorage session.
        const { data, error: sessionError } = await supabase.auth.setSession({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
        });

        if (sessionError || !data.session) {
          setError(sessionError?.message || "Failed to establish session");
          return;
        }

        const userId = data.session.user.id;

        // Determine user type to redirect correctly
        const [devRes, ownerRes] = await Promise.all([
          supabase.from("developers").select("id").eq("user_id", userId).maybeSingle(),
          supabase.from("lands").select("id").eq("owner_id", userId).limit(1),
        ]);

        if (devRes.data) {
          navigate("/crm/dashboard", { replace: true });
        } else if (ownerRes.data && ownerRes.data.length > 0) {
          navigate("/owner/dashboard", { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      } catch (err: any) {
        console.error("[ImpersonateCallback] Error:", err);
        setError(err.message || "Failed to process impersonation");
      }
    };

    processTokens();
  }, [navigate]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background" dir="rtl">
        <div className="text-center space-y-4">
          <p className="text-destructive text-lg">❌ فشل الدخول كمستخدم</p>
          <p className="text-muted-foreground text-sm">{error}</p>
          <button
            onClick={() => window.close()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm"
          >
            إغلاق
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-r-2 border-t-2 border-primary mx-auto" />
        <p className="text-muted-foreground text-sm">جارٍ تسجيل الدخول...</p>
      </div>
    </div>
  );
};

export default ImpersonateCallback;
