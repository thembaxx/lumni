import { memo } from "react";
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap font-body font-semibold text-xs transition-colors uppercase tracking-wider",
  {
    variants: {
      variant: {
        default: "bg-[var(--surface)] text-[var(--fg)] px-2.5 py-1 rounded-[var(--radius-sm)]",
        highlight:
          "bg-[var(--highlight-bg)] text-[var(--highlight-fg)] px-3 py-1.5 rounded-[var(--radius-lg)] font-bold normal-case tracking-normal",
        outline:
          "border border-[var(--fg)] text-[var(--fg)] bg-transparent px-2.5 py-1 rounded-[var(--radius-sm)]",
        colorBlock: "text-[var(--accent-green)] font-bold px-0 py-0 normal-case tracking-normal",
        secondary:
          "bg-[var(--surface)] text-[var(--fg-muted)] px-2.5 py-1 rounded-[var(--radius-sm)]",
        destructive: "bg-[var(--accent-red)] text-white px-2.5 py-1 rounded-[var(--radius-sm)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const Badge = memo(function Badge({
  className,
  variant = "default",
  render,
  children,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
        children: (
          <>
            {variant === "colorBlock" && (
              <span className="inline-block size-2 bg-[var(--accent-green)] rounded-none shrink-0" />
            )}
            {children}
          </>
        ),
      },
      props,
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  });
});

export { Badge };
