"use client";

import { useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { useTranslations } from "next-intl";

const SUBJECTS = [
  "Mathematics",
  "Physical Sciences",
  "Accounting",
  "Geography",
  "English",
  "Afrikaans",
  "History",
  "Life Sciences",
  "Economics",
  "Business Studies",
  "isiZulu",
  "Agricultural Sciences",
  "Technical Mathematics",
  "Consumer Studies",
];

function MarqueeRow({
  subjects,
  reverse,
  duration,
}: {
  subjects: string[];
  reverse?: boolean;
  duration: number;
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="relative flex overflow-hidden">
      <m.div
        className="flex shrink-0 gap-10 md:gap-16"
        initial={false}
        animate={
          prefersReducedMotion
            ? {}
            : {
                x: reverse ? ["0%", "-50%"] : ["-50%", "0%"],
              }
        }
        transition={{
          duration,
          ease: "linear",
          repeat: Number.POSITIVE_INFINITY,
        }}
      >
        {[...subjects, ...subjects].map((subject, i) => (
          <span
            key={`${subject}-${i}`}
            className="shrink-0 font-heading text-4xl font-bold tracking-tight text-muted-foreground/20 md:text-5xl"
          >
            {subject}
          </span>
        ))}
      </m.div>
    </div>
  );
}

export function MarqueeSection() {
  const t = useTranslations("home");
  const prefersReducedMotion = useReducedMotion();

  const mid = Math.ceil(SUBJECTS.length / 2);
  const row1 = SUBJECTS.slice(0, mid);
  const row2 = SUBJECTS.slice(mid);

  return (
    <section className="relative overflow-hidden py-20 md:py-28">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-r from-system-background via-transparent to-system-background" />
      </div>

      <m.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.4 }}
        className="mx-auto mb-12 max-w-6xl px-4"
      >
        <h2 className="text-center text-2xl font-bold text-muted-foreground/40 tracking-tight md:text-3xl">
          {t("featuresHeading")}
        </h2>
      </m.div>

      <div className="flex flex-col gap-8 md:gap-12">
        <MarqueeRow subjects={row1} duration={35} />
        <MarqueeRow subjects={row2} reverse duration={40} />
      </div>
    </section>
  );
}
