"use client";

import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon";
import SparklesIcon from "@hugeicons/core-free-icons/SparklesIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

interface CtaSectionProps {
  isAuthenticated: boolean;
}

export function CtaSection({ isAuthenticated }: CtaSectionProps) {
  const t = useTranslations("home");
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden py-28 md:py-44">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-10 mix-blend-luminosity grayscale"
          style={{
            backgroundImage: "url(https://picsum.photos/seed/graduation-ceremony/1920/800)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-system-background via-system-background/95 to-system-background" />
        <div className="absolute top-1/2 left-1/2 h-96 w-[90%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-primary/10 via-chart-3/8 to-chart-4/10 blur-[120px]" />
        <div className="absolute top-1/4 right-1/4 h-32 w-32 rounded-full bg-primary/15 blur-2xl animate-float-slow" />
        <div className="absolute bottom-1/4 left-1/4 h-24 w-24 rounded-full bg-chart-4/15 blur-2xl animate-float-drift" />
      </div>

      <div className="relative mx-auto max-w-3xl px-4 text-center">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.5 }}
          className="flex flex-col items-center gap-8"
        >
          <div className="flex size-16 items-center justify-center rounded-2xl bg-system-accent/10 shadow-level-1">
            <HugeiconsIcon icon={SparklesIcon} className="size-8 text-primary" />
          </div>

          <h2 className="max-w-2xl text-3xl font-extrabold text-foreground text-balance tracking-tight md:text-5xl md:leading-[1.1]">
            {t("ctaHeading")}
          </h2>

          <p className="max-w-lg text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
            {t("ctaDescription")}
          </p>

          <Button
            asChild
            size="lg"
            className="group relative gap-2 bg-primary text-primary-foreground shadow-level-2 transition-[box-shadow,transform] duration-300 hover:shadow-level-3 hover:scale-[1.02] press-scale"
          >
            <Link href={isAuthenticated ? "/dashboard" : "/auth/sign-up"}>
              {isAuthenticated ? t("heroDashboard") : t("heroStartFree")}
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                data-icon="inline-end"
              />
            </Link>
          </Button>
        </m.div>
      </div>
    </section>
  );
}
