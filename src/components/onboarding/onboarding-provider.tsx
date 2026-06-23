"use client";

import { useEffect, useState } from "react";
import { useOnboarding } from "@/hooks/use-onboarding";
import { CelebrationOverlay } from "./celebration-overlay";
import { OnboardingWizard } from "./onboarding-wizard";

const HAS_VISITED_KEY = "lumni_has_visited";
export const FIRST_VISITS_KEY = "lumni_first_visits_remaining";

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const { isOnboarding } = useOnboarding();
  const [showWizard, setShowWizard] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    const hasVisited = localStorage.getItem(HAS_VISITED_KEY);
    if (!hasVisited) {
      localStorage.setItem(HAS_VISITED_KEY, "true");
      if (isOnboarding) {
        setShowWizard(true);
      }
    }
  }, [isOnboarding]);

  const handleWizardComplete = () => {
    setShowWizard(false);
    setShowCelebration(true);
    const remaining = localStorage.getItem(FIRST_VISITS_KEY);
    if (!remaining) {
      localStorage.setItem(FIRST_VISITS_KEY, "3");
    }
  };

  const handleCelebrationComplete = () => {
    setShowCelebration(false);
  };

  if (showWizard) {
    return <OnboardingWizard onComplete={handleWizardComplete} />;
  }

  if (showCelebration) {
    return <CelebrationOverlay onComplete={handleCelebrationComplete} />;
  }

  return children;
}
