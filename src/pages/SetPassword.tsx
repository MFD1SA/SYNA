import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, arrivedWithAuthHash } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, LockKeyhole, CheckCircle2, XCircle } from "lucide-react";

/**
 * Set-password landing page for invited owners.
 *
 * The user arrives here via a one-time Supabase invite link. Supabase's
 * client library consumes the token automatically and establishes a
 * temporary session (`INITIAL_SESSION` auth event). At that point we can
 * call `updateUser({ password })` to finalize the account.
 */
const SetPassword: React.FC = () => {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const navigate = useNavigate();
  const { toast } = useToast();
  usePageTitle(isAr ? "تعيين كلمة المرور" : "Set Password");

  const [sessionReady, setSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Defense: this page can ONLY legitimately be reached via a Supabase
    // invite/recovery/signup email link, which embeds a token in the URL
    // fragment (#access_token=...&type=invite). `arrivedWithAuthHash` is
    // captured at module load BEFORE Supabase consumes the hash.
    //
    // If the flag is false, the user either:
    //   a) bookmarked / pasted the URL after the hash was stripped
    //   b) is an already-authenticated owner who navigated here manually
    // In case (b), allowing supabase.auth.updateUser() would let them
    // silently change their own password without re-authenticating — a
    // CSRF-adjacent hole. Refuse and redirect them to the password-reset
    // flow instead.
    if (!arrivedWithAuthHash) {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) {
          setSessionError(isAr
            ? "هذه الصفحة مخصصة لتأكيد دعوة جديدة فقط. لتغيير كلمة مرور حساب قائم يرجى استخدام نسيت كلمة المرور."
            : "This page is for new invite confirmation only. To change the password of an existing account, use the Forgot Password flow.");
        } else {
          setSessionError(isAr
            ? "انتهت صلاحية رابط الدعوة أو أنه غير صالح. يرجى طلب دعوة جديدة من المسؤول."
            : "Invite link is invalid or expired. Please request a new invite.");
        }
      });
      return;
    }

    // 1. Check if we already have a session from the invite link.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setSessionReady(true);
        return;
      }
    });
    // 2. Also listen for the auth event that fires once the token is exchanged.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) setSessionReady(true);
      if (event === "SIGNED_OUT") setSessionReady(false);
    });

    // 3. If after 4s still no session, surface an error — likely expired link.
    const timer = window.setTimeout(() => {
      setSessionReady((ready) => {
        if (!ready) {
          setSessionError(isAr
            ? "انتهت صلاحية رابط الدعوة أو أنه غير صالح. يرجى طلب دعوة جديدة من المسؤول."
            : "Invite link is invalid or expired. Please request a new invite.");
        }
        return ready;
      });
    }, 4000);

    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, [isAr]);

  const passwordStrong =
    password.length >= 10 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password);

  const match = password.length > 0 && password === confirm;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Belt-and-suspenders: even if the UI somehow bypassed the sessionError
    // branch, refuse to call updateUser without a legitimate invite hash.
    if (!arrivedWithAuthHash) {
      toast({
        variant: "destructive",
        title: isAr ? "جلسة غير صالحة" : "Invalid session",
        description: isAr
          ? "لا يمكن تعيين كلمة المرور بدون رابط دعوة صالح."
          : "Cannot set password without a valid invite link.",
      });
      return;
    }
    if (!passwordStrong) {
      toast({
        variant: "destructive",
        title: isAr ? "كلمة مرور ضعيفة" : "Weak password",
        description: isAr
          ? "يجب أن تحتوي على 10 أحرف على الأقل مع حرف كبير وصغير ورقم ورمز."
          : "Must be at least 10 chars with upper/lowercase, number, and symbol.",
      });
      return;
    }
    if (!match) {
      toast({ variant: "destructive", title: isAr ? "كلمتا المرور غير متطابقتين" : "Passwords don't match" });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast({ title: isAr ? "تم تعيين كلمة المرور بنجاح" : "Password set successfully" });
      // Route to owner dashboard.
      navigate("/owner/dashboard", { replace: true });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: isAr ? "تعذّر حفظ كلمة المرور" : "Couldn't save password",
        description: err?.message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0F1F2E] via-[#14283B] to-[#0A1520] p-4"
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-[#0F1F2E] px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
              <LockKeyhole className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-white text-lg font-bold">{isAr ? "تعيين كلمة المرور" : "Set Your Password"}</h1>
              <p className="text-white/60 text-xs mt-0.5">{isAr ? "سينا · الفرصة القادمة تبدأ هنا" : "SINA · Where your next opportunity begins"}</p>
            </div>
          </div>
        </div>

        <div className="p-8">
          {sessionError ? (
            <div className="text-center space-y-4">
              <XCircle className="mx-auto h-12 w-12 text-red-500" />
              <p className="text-[14px] text-gray-700">{sessionError}</p>
              <Button onClick={() => navigate("/auth/login")} variant="outline" className="w-full">
                {isAr ? "العودة لتسجيل الدخول" : "Back to Login"}
              </Button>
            </div>
          ) : !sessionReady ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-[#2B4C66]" />
              <p className="text-[13px] text-gray-500">{isAr ? "جاري التحقق من الدعوة..." : "Verifying invite..."}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-[13px] text-gray-600 leading-relaxed">
                {isAr
                  ? "مرحباً بك في سينا. اختر كلمة مرور قوية لتأمين حسابك."
                  : "Welcome to SINA. Choose a strong password to secure your account."}
              </p>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-[12px]">{isAr ? "كلمة المرور" : "Password"}</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  placeholder="••••••••••"
                />
                <div className="flex items-center gap-1.5 text-[11px]">
                  {passwordStrong
                    ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    : <XCircle className="h-3.5 w-3.5 text-gray-300" />
                  }
                  <span className={passwordStrong ? "text-emerald-600" : "text-gray-500"}>
                    {isAr
                      ? "10+ أحرف · كبير وصغير · رقم · رمز"
                      : "10+ chars · upper/lowercase · number · symbol"}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirm" className="text-[12px]">{isAr ? "تأكيد كلمة المرور" : "Confirm Password"}</Label>
                <Input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  autoComplete="new-password"
                  placeholder="••••••••••"
                />
                {confirm.length > 0 && (
                  <div className="flex items-center gap-1.5 text-[11px]">
                    {match
                      ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      : <XCircle className="h-3.5 w-3.5 text-red-400" />
                    }
                    <span className={match ? "text-emerald-600" : "text-red-500"}>
                      {match
                        ? (isAr ? "متطابقتان" : "Match")
                        : (isAr ? "غير متطابقتين" : "Don't match")}
                    </span>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                disabled={submitting || !passwordStrong || !match}
                className="w-full h-11 bg-[#2B4C66] hover:bg-[#1E374B] text-white font-semibold"
              >
                {submitting
                  ? <><Loader2 className="h-4 w-4 animate-spin me-2" />{isAr ? "جاري الحفظ..." : "Saving..."}</>
                  : (isAr ? "حفظ كلمة المرور والمتابعة" : "Save Password & Continue")
                }
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default SetPassword;
