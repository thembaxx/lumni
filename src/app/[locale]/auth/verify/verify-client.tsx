"use client";

import ArrowLeft01Icon from "@hugeicons/core-free-icons/ArrowLeft01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useReducer, useState } from "react";
import { OtpEmailForm } from "@/components/auth/otp-email-form";
import { OtpVerificationForm } from "@/components/auth/otp-verification-form";
import { OtpVerifiedView } from "@/components/auth/otp-verified-view";
import { initialOTPState, otpReducer } from "@/components/auth/otp-reducer";
import { EmailInputForm } from "@/components/auth/magic-link-dialog/email-input-form";
import { ResendSection } from "@/components/auth/magic-link-dialog/resend-section";
import { SuccessState } from "@/components/auth/magic-link-dialog/success-state";
import { toast } from "@/hooks/use-toast";
import { Link, useRouter } from "@/i18n/navigation";

type MagicLinkState = {
  email: string;
  error: string;
  sent: boolean;
  countdown: number;
};

type MagicLinkAction =
  | { type: "SET_EMAIL"; email: string }
  | { type: "SET_ERROR"; error: string }
  | { type: "SET_SENT" }
  | { type: "SET_COUNTDOWN"; countdown: number }
  | { type: "TICK" }
  | { type: "RESET" };

function magicLinkReducer(state: MagicLinkState, action: MagicLinkAction): MagicLinkState {
  switch (action.type) {
    case "SET_EMAIL":
      return { ...state, email: action.email };
    case "SET_ERROR":
      return { ...state, error: action.error };
    case "SET_SENT":
      return { ...state, sent: true, countdown: 2 * 60 * 1000 };
    case "SET_COUNTDOWN":
      return { ...state, countdown: action.countdown };
    case "TICK":
      return { ...state, countdown: Math.max(0, state.countdown - 1000) };
    case "RESET":
      return { email: "", error: "", sent: false, countdown: 0 };
  }
}

const initialMagicLinkState: MagicLinkState = {
  email: "",
  error: "",
  sent: false,
  countdown: 0,
};

function safeRedirect(url: string | null): string {
  if (!url) return "/admin";
  if (!url.startsWith("/") || url.startsWith("//")) return "/admin";
  if (url.includes("://") || url.includes("@")) return "/admin";
  return url;
}

export function VerifyClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const method = searchParams.get("method") || "otp";
  const redirect = safeRedirect(searchParams.get("redirect"));
  const [loading, setLoading] = useState(false);

  const [otpForm, otpDispatch] = useReducer(otpReducer, initialOTPState);
  const {
    email: otpEmail,
    otp,
    error: otpError,
    sent: otpSent,
    countdown: otpCountdown,
    remainingAttempts,
    verified,
  } = otpForm;

  const [mlForm, mlDispatch] = useReducer(magicLinkReducer, initialMagicLinkState);
  const { email: mlEmail, error: mlError, sent: mlSent, countdown: mlCountdown } = mlForm;

  const onAuthSuccess = useCallback(
    (isAdmin: boolean) => {
      localStorage.setItem("admin_session", "true");
      localStorage.setItem("admin_email", otpEmail || mlEmail);
      localStorage.setItem("admin_access", isAdmin ? "full" : "limited");
      router.push(redirect);
    },
    [otpEmail, mlEmail, redirect, router],
  );

  const doSendOtp = useCallback(async () => {
    const res = await fetch("/api/admin/auth/otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: otpEmail }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      if (data.locked || data.countdown) {
        otpDispatch({ type: "SET_COUNTDOWN", countdown: data.lockRemaining || data.countdown });
      }
      const msg = data.error || "Could not send code";
      otpDispatch({ type: "SET_ERROR", error: msg });
      toast({ type: "error", message: msg });
      return;
    }
    otpDispatch({ type: "SET_SENT" });
    toast({
      type: "success",
      message: "Check your inbox",
      description: `Verification code sent to ${otpEmail}`,
    });
  }, [otpEmail]);

  const handleSendOtp = useCallback(async () => {
    setLoading(true);
    otpDispatch({ type: "SET_ERROR", error: "" });
    try {
      await doSendOtp();
    } catch {
      otpDispatch({ type: "SET_ERROR", error: "Connection failed. Try again." });
    } finally {
      setLoading(false);
    }
  }, [doSendOtp]);

  const doVerifyOtp = useCallback(async () => {
    const res = await fetch("/api/admin/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ otpId: otpEmail, code: otp }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      if (data.locked) {
        otpDispatch({ type: "SET_COUNTDOWN", countdown: data.lockDuration });
      }
      if (data.remainingAttempts !== undefined) {
        otpDispatch({
          type: "SET_REMAINING_ATTEMPTS",
          remainingAttempts: data.remainingAttempts,
        });
      }
      const msg = data.error || "Incorrect code";
      otpDispatch({ type: "SET_ERROR", error: msg });
      toast({
        type: "error",
        message: msg,
        description: data.remainingAttempts
          ? `${data.remainingAttempts} attempt(s) left`
          : "Try again or request a new code",
      });
      otpDispatch({ type: "SET_OTP", otp: "" });
      return;
    }
    otpDispatch({ type: "SET_VERIFIED" });
    toast({
      type: "success",
      message: data.isAdmin ? "Welcome back, Admin!" : "Signed in successfully",
    });
    setTimeout(() => onAuthSuccess(data.isAdmin), 800);
  }, [otp, otpEmail, onAuthSuccess]);

  const handleVerifyOtp = useCallback(async () => {
    if (otp.length !== 6) {
      otpDispatch({ type: "SET_ERROR", error: "Enter all 6 digits from your email" });
      return;
    }
    setLoading(true);
    otpDispatch({ type: "SET_ERROR", error: "" });
    try {
      await doVerifyOtp();
    } catch {
      otpDispatch({ type: "SET_ERROR", error: "Connection failed" });
      otpDispatch({ type: "SET_OTP", otp: "" });
    } finally {
      setLoading(false);
    }
  }, [doVerifyOtp, otp.length]);

  const doResendOtp = useCallback(async () => {
    const res = await fetch("/api/admin/auth/resend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "otp", email: otpEmail }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      if (data.locked || data.countdown) {
        otpDispatch({ type: "SET_COUNTDOWN", countdown: data.lockRemaining || data.countdown });
      }
      otpDispatch({ type: "SET_ERROR", error: data.error || "Could not resend code" });
      return;
    }
    otpDispatch({ type: "SET_COUNTDOWN", countdown: 2 * 60 * 1000 });
  }, [otpEmail]);

  const handleResendOtp = useCallback(async () => {
    if (otpCountdown > 0) return;
    setLoading(true);
    otpDispatch({ type: "SET_ERROR", error: "" });
    otpDispatch({ type: "SET_OTP", otp: "" });
    try {
      await doResendOtp();
    } catch {
      otpDispatch({ type: "SET_ERROR", error: "Connection failed. Try again." });
    } finally {
      setLoading(false);
    }
  }, [otpCountdown, doResendOtp]);

  const doSendMagicLink = useCallback(async () => {
    const res = await fetch("/api/admin/auth/magic-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: mlEmail }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      if (data.locked || data.countdown) {
        mlDispatch({ type: "SET_COUNTDOWN", countdown: data.lockRemaining || data.countdown });
      }
      mlDispatch({ type: "SET_ERROR", error: data.error || "Could not send magic link" });
      return;
    }
    mlDispatch({ type: "SET_SENT" });
  }, [mlEmail, mlDispatch]);

  const handleSendMagicLink = useCallback(async () => {
    setLoading(true);
    mlDispatch({ type: "SET_ERROR", error: "" });
    try {
      await doSendMagicLink();
    } catch {
      mlDispatch({ type: "SET_ERROR", error: "Connection failed. Try again." });
    } finally {
      setLoading(false);
    }
  }, [doSendMagicLink]);

  const doResendMagicLink = useCallback(async () => {
    const res = await fetch("/api/admin/auth/resend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "magic-link", email: mlEmail }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      if (data.locked || data.countdown) {
        mlDispatch({ type: "SET_COUNTDOWN", countdown: data.lockRemaining || data.countdown });
      }
      mlDispatch({ type: "SET_ERROR", error: data.error || "Could not resend link" });
      return;
    }
    mlDispatch({ type: "SET_COUNTDOWN", countdown: 2 * 60 * 1000 });
  }, [mlEmail, mlDispatch]);

  const handleResendMagicLink = useCallback(async () => {
    if (mlCountdown > 0) return;
    setLoading(true);
    mlDispatch({ type: "SET_ERROR", error: "" });
    try {
      await doResendMagicLink();
    } catch {
      mlDispatch({ type: "SET_ERROR", error: "Connection failed. Try again." });
    } finally {
      setLoading(false);
    }
  }, [mlCountdown, doResendMagicLink]);

  useEffect(() => {
    if (otpSent && otpCountdown > 0) {
      const interval = setInterval(() => otpDispatch({ type: "TICK" }), 1000);
      return () => clearInterval(interval);
    }
  }, [otpSent, otpCountdown]);

  useEffect(() => {
    if (mlSent && mlCountdown > 0) {
      const interval = setInterval(() => mlDispatch({ type: "TICK" }), 1000);
      return () => clearInterval(interval);
    }
  }, [mlSent, mlCountdown]);

  if (method === "magic-link") {
    return (
      <div className="flex flex-col gap-6">
        {!mlSent ? (
          <>
            <div className="flex items-center gap-2">
              <Link href="/auth/sign-in" className="text-muted-foreground hover:text-foreground">
                <HugeiconsIcon icon={ArrowLeft01Icon} className="size-5" />
              </Link>
              <h1 className="font-semibold text-lg">Sign in with Magic Link</h1>
            </div>
            <p className="text-muted-foreground text-sm">
              Enter your admin email to receive a sign-in link
            </p>
            <EmailInputForm
              email={mlEmail}
              error={mlError}
              loading={loading}
              onEmailChange={(v) => {
                mlDispatch({ type: "SET_EMAIL", email: v });
                mlDispatch({ type: "SET_ERROR", error: "" });
              }}
              onSubmit={handleSendMagicLink}
            />
          </>
        ) : (
          <>
            <SuccessState email={mlEmail} error={mlError} />
            <ResendSection
              countdown={mlCountdown}
              loading={loading}
              onResend={handleResendMagicLink}
            />
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Link href="/auth/sign-in" className="text-muted-foreground hover:text-foreground">
          <HugeiconsIcon icon={ArrowLeft01Icon} className="size-5" />
        </Link>
        <h1 className="font-semibold text-lg">Sign in with Email OTP</h1>
      </div>

      <div>
        {!otpSent ? (
          <OtpEmailForm
            email={otpEmail}
            error={otpError}
            loading={loading}
            onEmailChange={(v) => {
              otpDispatch({ type: "SET_EMAIL", email: v });
              otpDispatch({ type: "SET_ERROR", error: "" });
            }}
            onSend={handleSendOtp}
          />
        ) : !verified ? (
          <OtpVerificationForm
            email={otpEmail}
            otp={otp}
            error={otpError}
            countdown={otpCountdown}
            remainingAttempts={remainingAttempts}
            loading={loading}
            onOtpChange={(v) => otpDispatch({ type: "SET_OTP", otp: v })}
            onVerify={handleVerifyOtp}
            onResend={handleResendOtp}
          />
        ) : (
          <OtpVerifiedView />
        )}
      </div>
    </div>
  );
}
