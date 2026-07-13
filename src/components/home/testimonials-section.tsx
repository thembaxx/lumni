"use client";

import { useTranslations } from "next-intl";
import { useReducedMotion } from "motion/react";
import * as m from "motion/react-m";

export function TestimonialsSection() {
  const t = useTranslations("home");
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="relative py-16 md:py-20">
      <div className="mx-auto max-w-4xl px-4">
        <div className="grid gap-12 md:grid-cols-2">
          {[1, 3].map((n, i) => (
            <m.blockquote
              key={n}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: prefersReducedMotion ? 0 : 0.5,
                delay: i * 0.1,
              }}
              className="flex flex-col gap-5"
            >
              <p className="text-base leading-relaxed text-muted-foreground italic">
                &ldquo;{t(`testimonial${n}Text`)}&rdquo;
              </p>
              <footer className="flex flex-col">
                <cite className="not-italic font-semibold text-sm text-foreground">
                  {t(`testimonial${n}Author`)}
                </cite>
                <span className="text-muted-foreground text-xs">{t(`testimonial${n}Detail`)}</span>
              </footer>
            </m.blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
