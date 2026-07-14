"use client";

import BellElectricIcon from "@hugeicons/core-free-icons/BellElectricIcon";
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { FadeIn } from "@/components/shared/fade-in";
import { Button } from "@/components/ui/button";
import { useOnboarding } from "@/hooks/use-onboarding";
import { useRouter } from "@/i18n/navigation";

const NUDGE_DISMISSED_KEY = "lumni_notification_nudge_dismissed";

export function NotificationNudge() {
  const { push } = useRouter();
  const { data } = useOnboarding();
  const [userDismissed, setUserDismissed] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem(NUDGE_DISMISSED_KEY) === "true";
  });

  const dismissed = userDismissed || data.isComplete || data.notificationsEnabled;

  if (dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem(NUDGE_DISMISSED_KEY, "true");
    setUserDismissed(true);
  };

  const handleEnable = () => {
    push("/settings");
    handleDismiss();
  };

  return (
    <FadeIn
      direction="down"
      distance={6}
      className="flex items-center gap-3 rounded-xl border border-system-accent/15 bg-system-accent/8 px-4 py-3"
    >
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-system-accent/15">
        <HugeiconsIcon icon={BellElectricIcon} className="size-4 text-system-accent" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-balance font-semibold text-sm">Enable study reminders</p>
        <p className="text-muted-foreground text-xs">Get daily nudges to keep your streak alive.</p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button size="sm" variant="default" className="h-8 px-3 text-xs" onClick={handleEnable}>
          Enable
        </Button>
        <button
          type="button"
          onClick={handleDismiss}
          className="-mr-1.5 rounded-md p-2 transition-colors hover:bg-muted/50"
          aria-label="Dismiss"
        >
          <HugeiconsIcon icon={Cancel01Icon} className="size-4 text-muted-foreground" data-icon />
        </button>
      </div>
    </FadeIn>
  );
}
