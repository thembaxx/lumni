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
    <section className="relative overflow-hidden py-28 md:py-40">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-10 mix-blend-luminosity"
          style={{ backgroundImage: "url(https://picsum.photos/seed/graduate-bg/1920/800)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-system-background via-system-background/95 to-system-background" />
        <div className="absolute top-1/2 left-1/2 h-72 w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-system-accent/10 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-3xl px-4 text-center">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.5 }}
          className="flex flex-col items-center gap-6"
        >
          <div className="flex size-14 items-center justify-center rounded-2xl bg-system-accent/10">
            <HugeiconsIcon icon={SparklesIcon} className="size-7 text-primary" />
          </div>

          <h2 className="max-w-2xl text-3xl font-extrabold text-foreground text-balance tracking-tight md:text-5xl">
            {t("ctaHeading")}
          </h2>

          <p className="max-w-lg text-balance text-base leading-relaxed text-muted-foreground md:text-lg">
            {t("ctaDescription")}
          </p>

          <Button
            asChild
            size="lg"
            className="group relative gap-2 bg-primary text-primary-foreground shadow-level-2 transition-[box-shadow] duration-300 hover:shadow-level-3 press-scale"
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
