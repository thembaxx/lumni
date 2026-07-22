"use client";

import Book02FreeIcons from "@hugeicons/core-free-icons/Book02Icon";
import Book03FreeIcons from "@hugeicons/core-free-icons/Book03Icon";
import BookOpenCheckFreeIcons from "@hugeicons/core-free-icons/BookOpenCheckIcon";
import Brain02FreeIcons from "@hugeicons/core-free-icons/Brain02Icon";
import Calendar02FreeIcons from "@hugeicons/core-free-icons/Calendar02Icon";
import DocumentValidationFreeIcons from "@hugeicons/core-free-icons/DocumentValidationIcon";
import Share07Icon from "@hugeicons/core-free-icons/Share07Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRef } from "react";
import { useTranslations } from "next-intl";
import { StudyPlanSheet } from "@/components/dashboard/study-plan-sheet";
import { Button } from "@/components/ui/button";
import { useNavigationDirection } from "@/hooks/use-navigation-direction";
import { cn } from "@/lib/utils";

export function QuickActions() {
  const { push } = useNavigationDirection();
  const scrollRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("dashboard.quickActions");

  const quickActions = [
    { icon: Brain02FreeIcons, labelKey: "practice", route: "/quiz", primary: true },
    { icon: DocumentValidationFreeIcons, labelKey: "examPapers", route: "/past-papers" },
    { icon: Calendar02FreeIcons, labelKey: "studyPlan" },
    { icon: Book02FreeIcons, labelKey: "bookmarks", route: "/bookmarks" },
    { icon: BookOpenCheckFreeIcons, labelKey: "review", route: "/review" },
    { icon: Book03FreeIcons, labelKey: "lessons", route: "/lessons" },
    { icon: Share07Icon, labelKey: "inviteFriend", route: "/settings/referral" },
  ];

  return (
    <div ref={scrollRef} className="w-full overflow-x-auto scrollbar-hide">
      <div className="flex items-center gap-2 py-1">
        {quickActions.map((action) =>
          action.labelKey === "studyPlan" ? (
            <StudyPlanSheet key={action.labelKey} />
          ) : (
            <Button
              key={action.labelKey}
              variant={action.primary ? "default" : "secondary"}
              onClick={() => push(action.route ?? "/")}
              className={cn(
                "pill-chip flex-nowrap",
                action.primary
                  ? "bg-(--system-accent) text-(--system-accent-foreground)"
                  : "bg-(--material-glass) text-(--system-text-primary)",
              )}
              aria-label={t(action.labelKey)}
            >
              <HugeiconsIcon
                icon={action.icon}
                className="size-4 shrink-0"
                data-icon
                aria-hidden="true"
              />
              <span className="whitespace-nowrap">{t(action.labelKey)}</span>
            </Button>
          ),
        )}
      </div>
    </div>
  );
}
