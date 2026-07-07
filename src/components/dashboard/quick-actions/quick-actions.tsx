"use client";

import Book02FreeIcons from "@hugeicons/core-free-icons/Book02Icon";
import Book03FreeIcons from "@hugeicons/core-free-icons/Book03Icon";
import BookOpenCheckFreeIcons from "@hugeicons/core-free-icons/BookOpenCheckIcon";
import Brain02FreeIcons from "@hugeicons/core-free-icons/Brain02Icon";
import Calendar02FreeIcons from "@hugeicons/core-free-icons/Calendar02Icon";
import DocumentValidationFreeIcons from "@hugeicons/core-free-icons/DocumentValidationIcon";
import Share07Icon from "@hugeicons/core-free-icons/Share07Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { StudyPlanSheet } from "@/components/dashboard/study-plan-sheet";
import { Button } from "@/components/ui/button";
import { useNavigationDirection } from "@/hooks/use-navigation-direction";

const quickActions = [
  { icon: Brain02FreeIcons, label: "Practice", route: "/quiz", primary: true },
  {
    icon: DocumentValidationFreeIcons,
    label: "Exam Papers",
    route: "/past-papers",
  },
  { icon: Calendar02FreeIcons, label: "Study Plan" },
  { icon: Book02FreeIcons, label: "Bookmarks", route: "/bookmarks" },
  { icon: BookOpenCheckFreeIcons, label: "Review", route: "/review" },
  { icon: Book03FreeIcons, label: "Lessons", route: "/lessons" },
  { icon: Share07Icon, label: "Invite Friend", route: "/settings/referral" },
];

function ActionButton({
  icon,
  label,
  onClick,
  primary,
}: {
  icon: readonly (readonly [string, { readonly [key: string]: string | number }])[];
  label: string;
  onClick?: () => void;
  primary?: boolean;
}) {
  return (
    <div
      className="motion-reduce:animate-none motion-reduce:transition-none"
      role="button"
      tabIndex={onClick ? 0 : -1}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
      onClick={onClick}
      aria-label={label}
    >
      {primary ? (
        <Button className="h-11 justify-start gap-2.5 rounded-card-lg px-5 text-system-accent-foreground">
          <span>
            <HugeiconsIcon icon={icon} className="size-4" data-icon aria-hidden="true" />
          </span>
          <span className="font-medium text-sm">{label}</span>
        </Button>
      ) : (
        <Button
          variant="secondary"
          className="h-11 justify-start gap-2.5 rounded-card-lg border border-border/80 bg-system-background-secondary px-5 text-foreground hover:border-accent hover:bg-accent press-scale transition-[scale,background-color,box-shadow,color,transform]"
        >
          <span className="text-accent">
            <HugeiconsIcon
              icon={icon}
              className="size-4 text-foreground"
              data-icon
              aria-hidden="true"
            />
          </span>
          <span className="font-medium text-sm">{label}</span>
        </Button>
      )}
    </div>
  );
}

export function QuickActions() {
  const { push } = useNavigationDirection();

  return (
    <div className="w-full">
      <ul className="scrollbar-hide flex items-center gap-3 overflow-x-auto py-1">
        {quickActions.map((action) => (
          <li key={action.label} className="shrink-0">
            {action.label === "Study Plan" ? (
              <StudyPlanSheet />
            ) : (
              <ActionButton
                icon={action.icon}
                label={action.label}
                onClick={() => push(action.route ?? "/")}
                primary={action.primary}
              />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
