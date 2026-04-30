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
import { log } from "@/lib/logger";

const ImpersonateCallback: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processTokens = async () => {
      try {
        // Only the hardened exchange flow is accepted: fragment is
        // `#x=<exchange_id>`. We POST the id to `impersonate-exchange`
        // which atomically consumes the row and returns the session
        // tokens. The exchange_id alone is useless after one consume
        // or after 60s.
        //
        // The legacy `#t=<base64 tokens>` and localStorage bridges were
        // removed 2026-04 — they accepted unvalidated tokens from URL
        // fragments / localStorage without server confirmation, so a
        // leaked link could be replayed offline. If an old admin client
        // is still on the legacy handoff, they will now see a clear
        // "unsupported impersonation link" error and must refresh the
        // admin panel to get the new exchange-based link.
        const hash = window.location.hash;

        if (!hash.startsWith("#x=")) {
          setError(
            "Unsupported impersonation link. Please refresh the admin panel " +
            "and re-issue the impersonation — the legacy token handoff has " +
            "been retired.",
          );
          return;
        }

        const exchangeId = decodeURIComponent(hash.slice(3));
        history.replaceState(null, "", window.location.pathname + window.location.search);
        const { data: exchData, error: exchErr } = await supabase.functions.invoke(
          "impersonate-exchange",
          { body: { exchange_id: exchangeId } },
        );
        if (exchErr || !exchData?.access_token || !exchData?.refresh_token) {
          setError(exchErr?.message || "Impersonation link expired or already used");
          return;
        }
        const tokens = {
          access_token: exchData.access_token as string,
          refresh_token: exchData.refresh_token as string,
        };

        // Ensure the impersonation flag is set (module-level code in client.ts
        // already sets it, but this is defence in depth).
        setImpersonationActive();

        // Establish session on the regular supabase client. Because this tab
        // was detected as an impersonation tab at module load, the client is
        // already configured to use sessionStorage — so this does NOT touch
        // the admin's localStorage session.
        const { data, error: sessionError } = await supabase.auth.setSession(tokens);

        if (sessionError || !data.session) {
          setError(sessionError?.message || "Failed to establish session");
          return;
        }

        const userId = data.session.user.id;

        // Determine user type via the authoritative role tables rather
        // than by existence of a `lands` row. An owner who has not yet
        // listed any land would otherwise be bounced to `/` instead of
        // the owner dashboard.
        const [rolesRes, devRes] = await Promise.all([
          supabase.from("user_roles").select("role").eq("user_id", userId),
          supabase.from("developers").select("id").eq("user_id", userId).maybeSingle(),
        ]);

        const roles = (rolesRes.data || []).map((r: { role: string }) => r.role);

        if (devRes.data) {
          navigate("/crm/dashboard", { replace: true });
        } else if (roles.includes("owner")) {
          navigate("/owner/dashboard", { replace: true });
        } else if (roles.includes("admin")) {
          // Impersonation targets should not be admins, but if one slipped
          // through (e.g. admin set as owner too), land on admin CP.
          navigate("/admincp/overview", { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      } catch (err: any) {
        log.error("[ImpersonateCallback] Error:", err);
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
