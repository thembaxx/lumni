"use client";

import { useEffect, useState } from "react";
import { useOnboarding } from "@/hooks/use-onboarding";
import { OnboardingWizard } from "./onboarding-wizard";

const HAS_VISITED_KEY = "lumni_has_visited";

export function OnboardingProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const { isOnboarding } = useOnboarding();
	const [showWizard, setShowWizard] = useState(false);

	useEffect(() => {
		const hasVisited = localStorage.getItem(HAS_VISITED_KEY);
		if (!hasVisited) {
			localStorage.setItem(HAS_VISITED_KEY, "true");
			if (isOnboarding) {
				setShowWizard(true);
			}
		}
	}, [isOnboarding]);

	if (showWizard) {
		return <OnboardingWizard onComplete={() => setShowWizard(false)} />;
	}

	return <>{children}</>;
}
