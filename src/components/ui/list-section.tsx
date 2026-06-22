import type * as React from "react";
import { cn } from "@/lib/utils";
import { ListGroup } from "./list-group";

interface ListSectionProps {
  children: React.ReactNode;
  header?: string;
  footer?: string;
  className?: string;
}

export function ListSection({ children, header, footer, className }: ListSectionProps) {
  return (
    <section className={cn("mb-8 last:mb-0", className)}>
      {header && (
        <div className="text-(length:--fs-footnote) px-6 py-3 font-medium text-[--system-text-tertiary] text-sm tracking-wider opacity-70">
          {header}
        </div>
      )}
      <ListGroup>{children}</ListGroup>
      {footer && (
        <div className="text-(length:--fs-caption-1) px-6 py-3 font-medium text-[--system-text-tertiary] leading-relaxed">
          {footer}
        </div>
      )}
    </section>
  );
}
