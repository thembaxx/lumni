"use client";

import { m } from "motion/react";
import { useTranslations } from "next-intl";
import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 1800;
          const start = performance.now();
          const animate = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - (1 - progress) ** 3;
            setDisplay(Math.floor(eased * value));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value]);

  return (
    <span ref={ref} className="tabular-nums">
      {display}
      {suffix}
    </span>
  );
}

const ACHIEVEMENTS = [
  { value: 14, suffix: "", label: "statSubjects" },
  { value: 5, suffix: " years", label: "statPapers" },
  { value: 1, suffix: "M+", label: "statQuestions" },
  { value: 0, suffix: "", label: "statFree" },
];

export function AnimatedStatsSection() {
  const t = useTranslations("home");
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden border-y border-border/20 py-20 md:py-28">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary/3 via-transparent to-chart-4/3" />
      <div className="pointer-events-none absolute top-1/2 left-1/3 h-40 w-40 rounded-full bg-primary/8 blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 right-1/3 h-40 w-40 rounded-full bg-chart-3/6 blur-3xl" />

      <div className="mx-auto max-w-6xl px-4">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4 md:gap-16">
          {ACHIEVEMENTS.map((stat, i) => (
            <m.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: prefersReducedMotion ? 0 : 0.5,
                delay: prefersReducedMotion ? 0 : i * 0.12,
              }}
              className="flex flex-col items-center gap-2 text-center"
            >
              <span className="font-heading text-5xl font-extrabold tracking-tight text-primary md:text-6xl">
                {stat.value > 0 ? (
                  <AnimatedNumber value={stat.value} suffix={stat.suffix} />
                ) : (
                  "Free"
                )}
              </span>
              <span className="max-w-28 text-balance text-sm text-muted-foreground md:text-base">
                {t(stat.label)}
              </span>
            </m.div>
          ))}
        </div>
      </div>
    </section>
  );
}
