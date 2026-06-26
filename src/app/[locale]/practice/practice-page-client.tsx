"use client";

import { useNavigationDirection } from "@/hooks/use-navigation-direction";
import { PageContainer } from "@/components/layout/page-container";
import { HugeiconsIcon } from "@hugeicons/react";
import File01Icon from "@hugeicons/core-free-icons/File01Icon";
import Calendar01Icon from "@hugeicons/core-free-icons/Calendar01Icon";
import Target01Icon from "@hugeicons/core-free-icons/Target01Icon";

const practiceItems = [
  { icon: File01Icon, label: "Exams", route: "/exams", desc: "Take full exams" },
  { icon: File01Icon, label: "Past Papers", route: "/past-papers", desc: "Previous exam papers" },
  {
    icon: Calendar01Icon,
    label: "Exam Dates",
    route: "/exam-dates",
    desc: "Upcoming exam schedule",
  },
  { icon: Target01Icon, label: "Review Mistakes", route: "/review", desc: "Review wrong answers" },
];

export function PracticePageClient() {
  const { push } = useNavigationDirection();

  return (
    <PageContainer>
      <div className="flex flex-col gap-6 py-6">
        <div>
          <h1 className="ios-title-1 font-extrabold text-foreground tracking-tight">Practice</h1>
          <p className="text-muted-foreground text-sm">Practice with exams and past papers</p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {practiceItems.map((item) => (
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
