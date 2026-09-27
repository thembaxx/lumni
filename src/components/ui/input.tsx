import { Input as InputPrimitive } from "@base-ui/react/input";
import type * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-[var(--radius-md)] border-2 border-[var(--fg)] bg-[var(--surface)] px-3.5 py-2 text-sm text-[var(--fg)] font-body outline-none transition-colors placeholder:text-[var(--fg-muted)] focus-visible:ring-2 focus-visible:ring-[var(--accent-green)] disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
