"use client";

import BookOpen01Icon from "@hugeicons/core-free-icons/BookOpen01Icon";
import BrainIcon from "@hugeicons/core-free-icons/BrainIcon";
import BulbIcon from "@hugeicons/core-free-icons/BulbIcon";
import ChartBarIcon from "@hugeicons/core-free-icons/BarChartIcon";
import GlobeIcon from "@hugeicons/core-free-icons/GlobeIcon";
import Target01Icon from "@hugeicons/core-free-icons/Target01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: BrainIcon,
    title: "AI-Generated Quizzes",
    description:
      "Practice with unlimited AI-generated quizzes tailored to your subject and grade level.",
    accent: "before:bg-(--system-accent-alpha-10)",
  },
  {
    icon: BookOpen01Icon,
    title: "Past Exam Papers",
    description: "Access all past papers and marking guides to prepare with real exam material.",
    accent: "before:bg-chart-4/10",
  },
  {
    icon: BulbIcon,
    title: "Smart Flashcards",
    description:
      "Spaced-repetition flashcards that adapt to your learning pace and track wrong answers.",
    accent: "before:bg-chart-3/10",
  },
  {
    icon: ChartBarIcon,
    title: "Progress Analytics",
    description:
      "Track your performance across subjects with detailed insights and competency scores.",
    accent: "before:bg-chart-2/10",
  },
  {
    icon: Target01Icon,
    title: "Study Planner",
    description:
      "Generate a personalised study plan based on your subjects, targets, and available time.",
    accent: "before:bg-chart-5/10",
  },
  {
    icon: GlobeIcon,
    title: "Share & Collaborate",
    description:
      "Share questions, compare leaderboards, and study together with peers in real time.",
    accent: "before:bg-chart-1/10",
  },
];

export function FeatureShowcaseSection() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="relative py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-4">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={prefersReducedMotion ? undefined : { duration: 0.4 }}
          className="mb-16 text-center"
        >
          <h2 className="ios-title-1 mb-3">Everything You Need to Succeed</h2>
          <p className="ios-body mx-auto max-w-lg text-muted-foreground">
            All features are completely free. No subscriptions, no hidden costs.
          </p>
        </m.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <m.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={prefersReducedMotion ? undefined : { delay: i * 0.05, duration: 0.4 }}
              className={cn(
                "group relative before:pointer-events-none before:absolute before:inset-0 before:rounded-lg before:opacity-0 before:transition-opacity before:duration-300 group-hover:before:opacity-100",
                feature.accent,
              )}
            >
              <div className="relative flex flex-col gap-4 rounded-lg border border-border/50 bg-system-background-secondary p-6 shadow-level-1">
                <div className="flex size-10 items-center justify-center rounded-md bg-(--system-accent-alpha-10)">
                  <HugeiconsIcon icon={feature.icon} className="size-5 text-primary" />
                </div>
                <div>
                  <h3 className="mb-2 font-semibold text-base sm:text-lg">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed sm:text-base">
                    {feature.description}
                  </p>
                </div>
              </div>
            </m.div>
          ))}
        </div>
      </div>
    </section>
  );
}
