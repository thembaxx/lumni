"use client";

import AlertCircleIcon from "@hugeicons/core-free-icons/AlertCircleIcon";
import CheckmarkCircle01Icon from "@hugeicons/core-free-icons/CheckmarkCircle01Icon";
import Clock01Icon from "@hugeicons/core-free-icons/Clock01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import * as m from "motion/react-m";
import { FadeIn } from "@/components/shared/fade-in";
import { SuccessBadge } from "../success-badge";
import { springPresets } from "@/lib/utils/spring-presets";

interface SuccessStateProps {
  email: string;
  error: string;
}

export function SuccessState({ email, error }: SuccessStateProps) {
  return (
    <FadeIn direction="up" distance={10} className="flex flex-col items-center gap-4 py-4">
      <div className="relative">
        <m.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{
            scale: 1,
            opacity: 1,
            transition: springPresets.fast,
          }}
        >
          <div className="rounded-full bg-success/10 p-4">
            <HugeiconsIcon icon={CheckmarkCircle01Icon} className="size-12 text-success" />
          </div>
        </m.div>
        <SuccessBadge isAdmin={false} />
      </div>

      <div className="flex flex-col gap-2 text-center">
        <p className="font-medium text-foreground text-lg">Magic link sent!</p>
        <p className="text-pretty text-muted-foreground text-sm">
          We&apos;ve sent a sign-in link to: <span className="font-medium">{email}</span>
        </p>
      </div>

      <FadeIn
        direction="up"
        distance={6}
        delay={0.12}
        className="rounded-xl border border-warning/30 bg-warning/10 px-4 py-2"
      >
        <p className="flex items-center gap-2 text-sm text-warning-foreground">
          <HugeiconsIcon icon={Clock01Icon} className="size-4" />
          <span className="font-medium">Link expires in 15 minutes</span>
        </p>
      </FadeIn>

      {error && (
        <p className="flex items-center gap-1 text-destructive text-xs">
          <HugeiconsIcon icon={AlertCircleIcon} className="size-3" />
          {error}
        </p>
      )}
    </FadeIn>
  );
}
