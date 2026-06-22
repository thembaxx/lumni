"use client";

import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon";
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
    <section className="relative py-16 md:py-20">
      <div className="absolute inset-0 bg-linear-to-b from-primary/5 via-transparent to-transparent" />
      <div className="relative mx-auto max-w-2xl px-4 text-center">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={prefersReducedMotion ? undefined : { duration: 0.4 }}
        >
          <h2 className="ios-title-1 mb-4">{t("ctaHeading")}</h2>
          <p className="ios-body mx-auto mb-8 max-w-md text-muted-foreground">
            {t("ctaDescription")}
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href={isAuthenticated ? "/dashboard" : "/auth/sign-up"}>
              <Button size="lg">
                {isAuthenticated ? t("heroDashboard") : t("heroStartFree")}
                <HugeiconsIcon icon={ArrowRight01Icon} data-icon="inline-end" />
              </Button>
            </Link>
            {!isAuthenticated && (
              <Link href="/auth/sign-in">
                <Button variant="ghost" size="lg">
                  {t("navSignIn")}
                </Button>
              </Link>
            )}
          </div>
        </m.div>
      </div>
    </section>
  );
}
