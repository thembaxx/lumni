"use client";

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

const STATS = [
  { value: 14, suffix: "", label: "NSC Subjects", icon: "📚" },
  { value: 5000, suffix: "+", label: "AI-Generated Questions", icon: "🧠" },
  { value: 50000, suffix: "+", label: "Active Students", icon: "🎓" },
  { value: 98, suffix: "%", label: "Satisfaction Rate", icon: "⭐" },
];

export function AnimatedStatsSection() {
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
    <section ref={ref} className="relative overflow-hidden py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-12 text-center">
          <p className="mb-2 font-medium text-primary text-sm tracking-widest uppercase">
            Trusted by students across South Africa
          </p>
          <h2 className="font-heading text-2xl font-extrabold tracking-tight sm:text-3xl">
            Learning that works
          </h2>
          <p className="mt-2 text-muted-foreground">
            Real numbers from real students preparing for their Matric exams
          </p>
        </div>
        <div
          className="bento-grid"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.6s ease, transform 0.6s ease",
          }}
        >
          {STATS.map((stat, i) => (
            <div
              key={stat.label}
              className="flex flex-col items-center gap-2 rounded-card border border-border/40 bg-card/60 p-6 text-center backdrop-blur-sm transition-all duration-500 hover:border-accent/30 hover:shadow-level-2"
              style={{
                opacity: 0,
                animation: visible
                  ? `fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.12}s forwards`
                  : "none",
              }}
            >
              <span className="text-2xl">{stat.icon}</span>
              <span className="font-heading text-3xl font-extrabold tracking-tight text-primary">
                <AnimatedNumber value={stat.value} suffix={stat.suffix} />
              </span>
              <span className="text-balance text-muted-foreground text-sm">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
