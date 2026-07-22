import { HugeiconsIcon } from "@hugeicons/react";
import type { HugeiconsIconProps } from "@hugeicons/react";

interface SectionHeadingProps {
  icon: HugeiconsIconProps["icon"];
  label: string;
}

export function SectionHeading({ icon, label }: SectionHeadingProps) {
  return (
    <div className="flex items-center gap-2">
      <HugeiconsIcon icon={icon} className="size-4 text-muted-foreground" aria-hidden="true" />
      <h2 className="font-extrabold text-(--fs-heading-3) text-foreground tracking-tight">
        {label}
      </h2>
    </div>
  );
}
