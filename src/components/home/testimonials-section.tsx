"use client";

import ArrowLeft01Icon from "@hugeicons/core-free-icons/ArrowLeft01Icon";
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useReducedMotion } from "motion/react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useCallback, useState } from "react";

const TESTIMONIALS = [1, 2, 3] as const;

const PORTRAITS = [
  "https://picsum.photos/seed/thandi-student/400/400",
  "https://picsum.photos/seed/sipho-graduate/400/400",
  "https://picsum.photos/seed/lerato-achiever/400/400",
];

export function TestimonialsSection() {
  const t = useTranslations("home");
  const prefersReducedMotion = useReducedMotion();
  const [active, setActive] = useState(0);

  const next = useCallback(() => {
    setActive((prev) => (prev + 1) % TESTIMONIALS.length);
  }, []);

  const prev = useCallback(() => {
    setActive((prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  }, []);

  return (
    <section className="relative overflow-hidden py-24 md:py-36">
      <div className="pointer-events-none absolute top-1/2 right-0 h-80 w-80 translate-y-[-50%] rounded-full bg-system-accent/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-72 w-72 rounded-full bg-chart-3/5 blur-3xl" />

      <div className="mx-auto max-w-6xl px-4">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.4 }}
          className="mb-14 flex flex-col gap-3"
        >
          <div className="flex h-1 w-10 rounded-full bg-primary" />
          <h2 className="text-3xl font-extrabold text-foreground text-balance tracking-tight md:text-4xl">
            {t("testimonialsHeading")}
          </h2>
          <p className="max-w-lg text-pretty text-base leading-relaxed text-muted-foreground">
            {t("testimonialsSubheading")}
          </p>
        </m.div>

        <div className="relative flex flex-col gap-12 md:flex-row md:items-center md:gap-20">
          <div className="relative flex h-56 w-full shrink-0 items-center justify-center md:h-80 md:w-72">
            <div className="absolute inset-0 flex items-center justify-center">
              {TESTIMONIALS.map((_, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "absolute rounded-full border-[3px] border-card transition-[transform,opacity] duration-700",
                    idx === active
                      ? "z-elevated h-44 scale-100 opacity-100 md:h-64 md:w-64"
                      : idx === (active + 1) % TESTIMONIALS.length
                        ? "z-elevated h-32 w-32 translate-x-20 translate-y-12 scale-90 opacity-70 md:h-44 md:w-44"
                        : "z-elevated h-24 w-24 -translate-x-20 -translate-y-10 scale-80 opacity-40 md:h-32 md:w-32",
                  )}
                >
                  <div
                    className="h-full w-full rounded-full bg-cover bg-center grayscale transition-[filter] duration-500"
                    style={{ backgroundImage: `url(${PORTRAITS[idx]})` }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-6">
            <AnimatePresence mode="wait" initial={false}>
              <m.div
                key={active}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col gap-5"
              >
                <p className="text-lg leading-relaxed text-muted-foreground italic md:text-xl md:leading-relaxed">
                  &ldquo;{t(`testimonial${TESTIMONIALS[active]}Text`)}&rdquo;
                </p>
                <footer className="flex flex-col gap-0.5">
                  <cite className="not-italic font-bold text-foreground">
                    {t(`testimonial${TESTIMONIALS[active]}Author`)}
                  </cite>
                  <span className="text-sm text-muted-foreground">
                    {t(`testimonial${TESTIMONIALS[active]}Detail`)}
                  </span>
                </footer>
              </m.div>
            </AnimatePresence>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={prev}
                className="relative flex size-11 items-center justify-center rounded-full border border-border/30 bg-card text-foreground transition-[background-color,border-color,color] duration-300 hover:bg-system-accent hover:text-primary-foreground hover:border-primary/30 active:scale-[0.96] after:absolute after:-inset-1"
                aria-label="Previous testimonial"
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" data-icon />
              </button>
              <div className="flex gap-2">
                {TESTIMONIALS.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActive(idx)}
                    className={cn(
                      "relative h-2 rounded-full transition-[width,background-color] duration-500 after:absolute after:-inset-2",
                      idx === active ? "w-10 bg-primary" : "w-2 bg-border/40 hover:bg-border/70",
                    )}
                    aria-label={`Go to testimonial ${idx + 1}`}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={next}
                className="relative flex size-11 items-center justify-center rounded-full border border-border/30 bg-card text-foreground transition-[background-color,border-color,color] duration-300 hover:bg-system-accent hover:text-primary-foreground hover:border-primary/30 active:scale-[0.96] after:absolute after:-inset-1"
                aria-label="Next testimonial"
              >
                <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
