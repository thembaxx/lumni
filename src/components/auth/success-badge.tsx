"use client";

import FlashIcon from "@hugeicons/core-free-icons/FlashIcon";
import SparklesIcon from "@hugeicons/core-free-icons/SparklesIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import * as m from "motion/react-m";
import { useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { springPresets } from "@/lib/utils/spring-presets";
import { Anim } from "@/components/shared/anim";
import { Badge } from "@/components/ui/badge";
import { CLIPBOARD_CONFIRMATION_DURATION } from "@/lib/shared/durations";
import { cn } from "@/lib/utils";

export function SuccessBadge({ isAdmin }: { isAdmin: boolean }) {
  const [show, setShow] = useState(true);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const timer = setTimeout(() => setShow(false), CLIPBOARD_CONFIRMATION_DURATION);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <Anim>
      <m.div
        className="absolute -top-1 -right-1 motion-reduce:animate-none motion-reduce:transition-none"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={
          prefersReducedMotion
            ? { scale: 1, opacity: 1, transition: { duration: 0 } }
            : { scale: 1, opacity: 1, transition: springPresets.fast }
        }
        exit={{ scale: 0.95, opacity: 0 }}
      >
        <div className="relative">
          <div className="absolute inset-0 animate-ping opacity-75">
            <HugeiconsIcon icon={SparklesIcon} className="size-4 text-warning-foreground" />
          </div>
          <HugeiconsIcon icon={SparklesIcon} className="relative z-elevated size-4 text-warning" />
        </div>
      </m.div>

      <m.div
        className="absolute -right-1 -bottom-1"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={
          prefersReducedMotion
            ? { scale: 1, opacity: 1, transition: { duration: 0 } }
            : { scale: 1, opacity: 1, transition: { ...springPresets.fast, delay: 0.1 } }
        }
        exit={{ scale: 0.95, opacity: 0 }}
      >
        <Badge
          variant={isAdmin ? "default" : "secondary"}
          className={cn(
            "ios-caption-3 gap-1 px-2 font-medium",
            isAdmin && "bg-success/20 text-success-foreground",
          )}
        >
          <HugeiconsIcon icon={FlashIcon} className="size-3" />
          {isAdmin ? "Admin" : "Welcome"}
        </Badge>
      </m.div>
    </Anim>
  );
}
