"use client";

import Logout01Icon from "@hugeicons/core-free-icons/Logout01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";

interface SignOutSectionProps {
  isAnonymous: boolean;
  onSignOut: () => void;
}

export function SignOutSection({ isAnonymous, onSignOut }: SignOutSectionProps) {
  return (
    <div className="px-2 pt-4">
      {!isAnonymous && (
        <Button
          size="default"
          variant="destructive"
          onClick={onSignOut}
          className="w-full rounded-lg font-medium text-sm shadow-level-2 transition-[transform,opacity] active:scale-[0.96]"
        >
          <HugeiconsIcon icon={Logout01Icon} data-icon />
          Sign Out
        </Button>
      )}
      <div className="mt-8 flex flex-col items-center gap-1">
        <p className="text-(length:--fs-footnote) font-extrabold text-(--system-text-tertiary) uppercase tracking-widest">
          Lumni Mobile
        </p>
        <p className="text-(length:--fs-caption-2) font-medium text-(--system-text-tertiary) tabular-nums">
          Version 1.0.4 (Stable-RC)
        </p>
      </div>
    </div>
  );
}
