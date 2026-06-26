"use client";

import { useNavigationDirection } from "@/hooks/use-navigation-direction";
import { PageContainer } from "@/components/layout/page-container";
import Quiz01Icon from "@hugeicons/core-free-icons/Quiz01Icon";
import FlashIcon from "@hugeicons/core-free-icons/FlashIcon";
import BookOpen01Icon from "@hugeicons/core-free-icons/BookOpen01Icon";
import Mic01Icon from "@hugeicons/core-free-icons/Mic01Icon";
import { HugeiconsIcon } from "@hugeicons/react";

const learnItems = [
  { icon: Quiz01Icon, label: "Quiz", route: "/quiz", desc: "Adaptive practice quizzes" },
  { icon: FlashIcon, label: "Flashcards", route: "/flashcards", desc: "Spaced repetition" },
  { icon: BookOpen01Icon, label: "Problems", route: "/problems", desc: "Past exam problems" },
  { icon: BookOpen01Icon, label: "Stories", route: "/stories", desc: "Read stories" },
  { icon: Mic01Icon, label: "Pronunciation", route: "/pronunciation", desc: "Practice speaking" },
  { icon: BookOpen01Icon, label: "Lessons", route: "/lessons", desc: "Explore lessons" },
];

export function LearnPageClient() {
  const { push } = useNavigationDirection();

  return (
    <PageContainer>
      <div className="flex flex-col gap-6 py-6">
        <div>
          <h1 className="ios-title-1 font-extrabold text-foreground tracking-tight">Learn</h1>
          <p className="text-muted-foreground text-sm">Explore learning resources</p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {learnItems.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => push(item.route)}
              className="flex items-start gap-4 rounded-xl border border-border/60 bg-card p-4 text-left transition-colors hover:bg-accent/5"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-(--system-accent)/10">
                <HugeiconsIcon icon={item.icon} className="size-5 text-(--system-accent)" />
              </div>
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="font-semibold text-sm text-foreground">{item.label}</span>
                <span className="text-muted-foreground text-xs">{item.desc}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
