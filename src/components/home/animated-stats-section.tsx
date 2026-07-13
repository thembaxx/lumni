"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

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
          const duration = 1500;
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

    observer.observe(el);
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
  { value: 14, suffix: "", label: "statSubjects", icon: "📘" },
  { value: 5, suffix: " years", label: "statPapers", icon: "📄" },
  { value: 1, suffix: "M+", label: "statQuestions", icon: "🧠" },
  { value: 0, suffix: "", label: "statFree", icon: "✓" },
];

export function AnimatedStatsSection() {
  const t = useTranslations("home");
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="relative py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.6s ease, transform 0.6s ease",
          }}
        >
          {ACHIEVEMENTS.map((stat, i) => (
            <div
              key={stat.label}
              className="flex flex-col items-center gap-2 p-4 text-center"
              style={{
                opacity: 0,
                animation: visible
                  ? `fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.12}s forwards`
                  : "none",
              }}
            >
              <span className="font-heading text-3xl font-bold tracking-tight text-primary">
                {stat.value > 0 ? (
                  <AnimatedNumber value={stat.value} suffix={stat.suffix} />
                ) : (
                  "Free"
                )}
              </span>
              <span className="text-balance text-muted-foreground text-sm">{t(stat.label)}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
