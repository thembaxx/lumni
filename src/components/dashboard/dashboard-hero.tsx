"use client";

import { useTranslations } from "next-intl";
import { SpotlightCard } from "@/components/shared/motion-primitives";

export function HeroBanner() {
  const t = useTranslations();

  return (
    <SpotlightCard className="card-entrance rounded-card-lg" radius={420}>
      <div
        className="relative mt-3 mb-1 overflow-hidden rounded-card-lg bg-linear-to-br from-(--system-accent)/10 via-(--system-accent)/5 to-transparent shadow-level-2"
        aria-label="Dashboard header showing welcome message"
        role="banner"
      >
        <div className="relative flex max-w-3xl flex-col justify-center px-6 py-4 sm:px-8">
          <h1 className="ios-title-1 max-w-lg font-extrabold text-foreground leading-tight tracking-tight">
            {t("dashboard.title")}
          </h1>
          <p className="mt-2 max-w-md text-muted-foreground text-sm">{t("dashboard.subtitle")}</p>
        </div>
      </div>
    </SpotlightCard>
  );
}
