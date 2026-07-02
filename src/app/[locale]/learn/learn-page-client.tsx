"use client";

import BookOpen01Icon from "@hugeicons/core-free-icons/BookOpen01Icon";
import FlashIcon from "@hugeicons/core-free-icons/FlashIcon";
import Mic01Icon from "@hugeicons/core-free-icons/Mic01Icon";
import Quiz01Icon from "@hugeicons/core-free-icons/Quiz01Icon";
import StarsIcon from "@hugeicons/core-free-icons/StarsIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { PageContainer } from "@/components/layout/page-container";
import { useNavigationDirection } from "@/hooks/use-navigation-direction";
import { motionEase } from "@/lib/utils/animation";

const learnItems = [
  {
    icon: Quiz01Icon,
    label: "Quiz",
    route: "/quiz",
    desc: "Adaptive practice quizzes",
    gradient: "from-primary/20 to-primary/5",
  },
  {
    icon: FlashIcon,
    label: "Flashcards",
    route: "/flashcards",
    desc: "Spaced repetition",
    gradient: "from-chart-3/20 to-chart-3/5",
  },
  {
    icon: BookOpen01Icon,
    label: "Problems",
    route: "/problems",
    desc: "Past exam problems",
    gradient: "from-chart-4/20 to-chart-4/5",
  },
  {
    icon: StarsIcon,
    label: "Stories",
    route: "/stories",
    desc: "Read & learn",
    gradient: "from-chart-2/20 to-chart-2/5",
  },
  {
    icon: Mic01Icon,
    label: "Pronunciation",
    route: "/pronunciation",
    desc: "Practice speaking",
    gradient: "from-chart-5/20 to-chart-5/5",
  },
  {
    icon: BookOpen01Icon,
    label: "Lessons",
    route: "/lessons",
    desc: "Explore lessons",
    gradient: "from-primary/10 to-chart-4/10",
  },
];

export function LearnPageClient() {
  const { push } = useNavigationDirection();
  const prefersReducedMotion = useReducedMotion();

  return (
    <PageContainer>
      <div className="flex flex-col gap-6 py-6">
        <m.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
        >
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-(--system-accent-alpha-10) px-3 py-1 ios-caption-3 text-primary">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
            Choose your path
          </div>
          <h1 className="ios-title-1 font-extrabold text-foreground tracking-tight">Learn</h1>
          <p className="text-muted-foreground text-sm">Explore learning resources</p>
        </m.div>

        <m.div
          className="grid grid-cols-1 gap-3 sm:grid-cols-2"
          initial={prefersReducedMotion ? undefined : "hidden"}
          animate={prefersReducedMotion ? undefined : "visible"}
          variants={{
            visible: { transition: { staggerChildren: prefersReducedMotion ? 0 : 0.06 } },
          }}
        >
          {learnItems.map((item) => (
            <m.button
              key={item.label}
              type="button"
              onClick={() => push(item.route)}
              initial={prefersReducedMotion ? undefined : { opacity: 0, y: 16 }}
              animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.4, ease: motionEase }}
              className="group relative overflow-hidden rounded-card border border-border/40 bg-card p-5 text-left shadow-level-1 transition-[box-shadow,transform] duration-300 hover:shadow-level-2 active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-primary"
            >
              <div
                className={`pointer-events-none absolute inset-0 bg-linear-to-br opacity-0 transition-opacity duration-500 group-hover:opacity-100 ${item.gradient}`}
              />
              <div className="relative z-10 flex items-start gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-(--system-accent-alpha-10) text-primary transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <HugeiconsIcon icon={item.icon} className="size-5" />
                </div>
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="font-semibold text-sm text-foreground">{item.label}</span>
                  <span className="text-muted-foreground text-xs">{item.desc}</span>
                </div>
              </div>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  className="text-muted-foreground"
                >
                  <path
                    d="M6 4l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </m.button>
          ))}
        </m.div>
      </div>
    </PageContainer>
  );
}
