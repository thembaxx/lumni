"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useOnboarding } from "@/hooks/use-onboarding";

const HAS_VISITED_KEY = "lumni_has_visited";
export const FIRST_VISITS_KEY = "lumni_first_visits_remaining";

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const { isOnboarding } = useOnboarding();
  const [checked, setChecked] = useState(false);
  const { push } = useRouter();

  useEffect(() => {
    const hasVisited = localStorage.getItem(HAS_VISITED_KEY);
    if (!hasVisited) {
      localStorage.setItem(HAS_VISITED_KEY, "true");
      if (isOnboarding) {
        push("/onboarding");
        return;
      }
    }
    setChecked(true);
  }, [isOnboarding, push]);

  if (!checked) return null;

  return children;
}
