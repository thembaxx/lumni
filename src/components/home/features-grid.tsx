"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function FeaturesGrid() {
  const t = useTranslations("home");

  const featureList = [
    {
      titleKey: "featureAIPractice",
      descKey: "featureAIPracticeDesc",
      badgeColor: "bg-[var(--accent-green)]",
    },
    {
      titleKey: "featurePastPapers",
      descKey: "featurePastPapersDesc",
      badgeColor: "bg-[var(--accent-gold)]",
    },
    {
      titleKey: "featurePlanner",
      descKey: "featurePlannerDesc",
      badgeColor: "bg-[var(--accent-red)]",
    },
    {
      titleKey: "featureOffline",
      descKey: "featureOfflineDesc",
      badgeColor: "bg-[var(--fg)]",
    },
    {
      titleKey: "featureTracking",
      descKey: "featureTrackingDesc",
      badgeColor: "bg-[var(--accent-green)]",
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-[var(--bg)]">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-12 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-block size-3 bg-[var(--accent-red)]" aria-hidden="true" />
            <span className="font-body font-bold text-xs uppercase tracking-wider text-[var(--fg-muted)]">
              BUILT FOR MATRIC
            </span>
          </div>
          <h2 className="font-display text-3xl font-extrabold text-[var(--fg)] tracking-tight md:text-4xl">
            {t("featuresHeading")}
          </h2>
          <p className="max-w-xl font-body text-base text-[var(--fg-muted)]">
            {t("featuresSubheading")}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {featureList.map((item) => (
            <Card key={item.titleKey} variant="flat" className="flex flex-col justify-between">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`inline-block size-2.5 ${item.badgeColor}`} aria-hidden="true" />
                </div>
                <CardTitle className="text-xl">{t(item.titleKey)}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm text-[var(--fg-muted)] leading-relaxed">
                  {t(item.descKey)}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
