import type * as React from "react";

import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "wide";
}

/**
 * PageContainer — unified page layout wrapper.
 *
 * Design system rules:
 * - Every page (except home feed and admin dashboards) must use this component.
 * - No page should declare its own `max-w-*` or `px-*`.
 * - Use `variant="wide"` for home feed and admin dashboards only.
 */
function PageContainer({ children, className, variant = "default" }: PageContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full flex-col",
        variant === "default"
          ? "max-w-3xl px-4 sm:px-6 lg:max-w-4xl xl:max-w-6xl"
          : "max-w-6xl px-4 sm:px-6 xl:max-w-7xl",
        className,
      )}
    >
      {children}
    </div>
  );
}

export { PageContainer };
