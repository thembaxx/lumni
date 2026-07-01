"use client";

import RadialIcon from "@hugeicons/core-free-icons/RadialIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import * as m from "motion/react-m";
import { useTranslations } from "next-intl";
import { LoadingShell } from "@/components/loading/loading-shell";
import { iOSEase } from "@/lib/utils/animation";

export function FlashcardsLoading() {
  const t = useTranslations();
  return (
    <LoadingShell>
      <div className="flex flex-col items-center gap-(--space-6)">
        <m.div
          initial={{ opacity: 0, scale: 0.8, filter: "blur(4px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.3, ease: iOSEase }}
          className="relative"
        >
          <div className="absolute inset-0 animate-pulse-glow blur-xl" />
          <div className="relative flex size-20 items-center justify-center rounded-2xl border border-system-accent/20 bg-system-accent/10">
            <div className="size-14 animate-spin [animation-duration:1.5s]">
              <HugeiconsIcon icon={RadialIcon} className="size-14 text-system-accent" />
            </div>
          </div>
        </m.div>

        <m.h2
          initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.4, ease: iOSEase, delay: 0.08 }}
          className="ios-title-2 text-center text-(--system-text-primary)"
        >
          {t("flashcards.title")}
        </m.h2>

        <m.p
          initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.35, ease: iOSEase, delay: 0.12 }}
          className="ios-footnote text-center text-(--system-text-secondary)"
        >
          {t("flashcards.loading")}
        </m.p>
      </div>
    </LoadingShell>
  );
}
