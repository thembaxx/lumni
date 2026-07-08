"use client";

import AlertCircleIcon from "@hugeicons/core-free-icons/AlertCircleIcon";
import CheckmarkCircle01Icon from "@hugeicons/core-free-icons/CheckmarkCircle01Icon";
import FlashIcon from "@hugeicons/core-free-icons/FlashIcon";
import RadialIcon from "@hugeicons/core-free-icons/RadialIcon";
import RefreshIcon from "@hugeicons/core-free-icons/RefreshIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import * as m from "motion/react-m";
import { Anim } from "@/components/shared/anim";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { cn } from "@/lib/utils";
import { iOSEase } from "@/lib/utils/animation";
import { buttonStyles, countdownStyles, iconStyles } from "./auth-styles";
import { formatCountdown } from "./countdown-utils";
import { LoadingDots } from "./loading-dots";

interface OtpVerificationFormProps {
  email: string;
  otp: string;
  error: string;
  countdown: number;
  remainingAttempts: number | null;
  loading: boolean;
  onOtpChange: (otp: string) => void;
  onVerify: () => void;
  onResend: () => void;
}

export function OtpVerificationForm({
  email,
  otp,
  error,
  countdown,
  remainingAttempts,
  loading,
  onOtpChange,
  onVerify,
  onResend,
}: OtpVerificationFormProps) {
  return (
    <Anim>
      <m.div
        className="flex flex-col items-center gap-4 py-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.4,
            ease: iOSEase,
          },
        }}
        exit={{
          opacity: 0,
          y: -8,
          transition: {
            duration: 0.3,
            ease: iOSEase,
          },
        }}
      >
        <div className="relative">
          <m.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{
              scale: 1,
              opacity: 1,
              transition: {
                type: "spring",
                stiffness: 350,
                damping: 26,
                bounce: 0,
              },
            }}
          >
            <div className="rounded-full bg-success/10 p-3">
              <HugeiconsIcon icon={CheckmarkCircle01Icon} className="size-8 text-success" />
            </div>
          </m.div>
        </div>

        <div className="text-center">
          <p className="text-muted-foreground text-sm">
            We&apos;ve sent a verification code to:{" "}
            <span className="font-medium text-foreground">{email}</span>
          </p>
        </div>

        <div className="flex w-full flex-col gap-3">
          <div className="flex justify-center">
            <InputOTP
              value={otp}
              onChange={(value) => onOtpChange(value)}
              maxLength={6}
              aria-invalid={remainingAttempts !== null && remainingAttempts < 3}
              onComplete={onVerify}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          {error && (
            <p className="flex items-center justify-center gap-1 text-destructive text-xs">
              <HugeiconsIcon icon={AlertCircleIcon} className="size-3" />
              {error}
            </p>
          )}
        </div>

        <Button
          onClick={onVerify}
          disabled={loading || otp.length !== 6}
          className={cn("w-full", buttonStyles)}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <LoadingDots />
              <span>Verifying…</span>
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <HugeiconsIcon icon={FlashIcon} className="size-4" />
              Verify
            </span>
          )}
        </Button>

        <div className="flex w-full items-center gap-4">
          <div className="h-px flex-1 bg-border" />
          <span className="text-muted-foreground text-xs">Didn&apos;t receive it?</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <div className="flex w-full items-center justify-between">
          <p className={cn("text-muted-foreground text-sm", countdownStyles)}>
            {countdown > 0 ? (
              <span className="font-medium text-foreground tabular-nums">
                {formatCountdown(countdown)}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-foreground">
                <HugeiconsIcon icon={FlashIcon} className="size-3" />
                Ready
              </span>
            )}
          </p>

          <Button
            variant="ghost"
            size="sm"
            onClick={onResend}
            disabled={loading || countdown > 0}
            className={cn(buttonStyles, loading && "opacity-70")}
          >
            {loading ? (
              <HugeiconsIcon icon={RadialIcon} className="size-4 animate-spin" />
            ) : (
              <>
                <HugeiconsIcon
                  icon={RefreshIcon}
                  className={cn("size-4", iconStyles, countdown > 0 && "animate-pulse")}
                />
                <span className="ml-2">Resend OTP</span>
              </>
            )}
          </Button>
        </div>
      </m.div>
    </Anim>
  );
}
