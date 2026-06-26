"use client";

import { useNavigationDirection } from "@/hooks/use-navigation-direction";
import { PageContainer } from "@/components/layout/page-container";
import { HugeiconsIcon } from "@hugeicons/react";
import Calendar01Icon from "@hugeicons/core-free-icons/Calendar01Icon";
import Bookmark02Icon from "@hugeicons/core-free-icons/Bookmark02Icon";
import Settings01Icon from "@hugeicons/core-free-icons/Settings01Icon";

const progressItems = [
  { icon: Calendar01Icon, label: "Study Plan", route: "/study-plan", desc: "Your study schedule" },
  { icon: Bookmark02Icon, label: "Bookmarks", route: "/bookmarks", desc: "Saved bookmarks" },
  { icon: Settings01Icon, label: "Settings", route: "/settings", desc: "App settings" },
];

export function ProgressPageClient() {
  const { push } = useNavigationDirection();

  return (
    <PageContainer>
      <div className="flex flex-col gap-6 py-6">
        <div>
          <h1 className="ios-title-1 font-extrabold text-foreground tracking-tight">Progress</h1>
          <p className="text-muted-foreground text-sm">Track your learning progress</p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {progressItems.map((item) => (
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
