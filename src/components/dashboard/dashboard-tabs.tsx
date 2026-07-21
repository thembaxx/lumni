"use client";

import { usePathname, Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { label: "Today", route: "/dashboard" },
  { label: "Progress", route: "/progress" },
  { label: "Study Plan", route: "/study-plan" },
  { label: "Explore", route: "/explore" },
] as const;

export function DashboardTabs() {
  const pathname = usePathname();

  return (
    <div
      className="flex gap-1 rounded-2xl bg-muted/50 p-1 ring-1 ring-border/30"
      role="tablist"
      aria-label="Dashboard sections"
    >
      {tabs.map((tab) => {
        const isActive =
          tab.route === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(tab.route);
        return (
          <Link
            key={tab.route}
            href={tab.route}
            role="tab"
            aria-selected={isActive}
            className={cn(
              "rounded-xl px-3 py-1.5 font-medium text-sm transition-all duration-200",
              isActive
                ? "bg-background text-foreground shadow-level-1"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
