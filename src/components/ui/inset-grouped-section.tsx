import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface InsetGroupedSectionProps {
  header?: string;
  children: ReactNode;
  className?: string;
  footer?: string;
}

export function InsetGroupedSection({
  header,
  children,
  className,
  footer,
}: InsetGroupedSectionProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      {header && (
        <h3 className="ios-footnote mb-1.5 ml-4 font-semibold uppercase tracking-[0.05em] text-muted-foreground">
          {header}
        </h3>
      )}
      <div className="overflow-hidden rounded-list-group border border-border/50 bg-card shadow-level-1">
        {children}
      </div>
      {footer && <p className="ios-caption-1 mt-1.5 ml-4 text-muted-foreground">{footer}</p>}
    </div>
  );
}

interface InsetGroupedRowProps {
  children: ReactNode;
  className?: string;
  role?: string;
}

export function InsetGroupedRow({ children, className, role }: InsetGroupedRowProps) {
  return (
    <div
      role={role}
      className={cn(
        "flex min-h-11 items-center justify-between gap-3 border-border/50 border-b px-4 py-3 last:border-b-0",
        className,
      )}
    >
      {children}
    </div>
  );
}
