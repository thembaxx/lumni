"use client";

import { useEffect, useState } from "react";
import { useOnboarding } from "@/hooks/use-onboarding";
import { OnboardingWizard } from "./onboarding-wizard";

export function OnboardingProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const { isOnboarding } = useOnboarding();
	const [showOnboarding, setShowOnboarding] = useState(false);

	useEffect(() => {
		if (typeof window !== "undefined") {
			const hasVisited = localStorage.getItem("lumni_has_visited");
			if (!hasVisited) {
				localStorage.setItem("lumni_has_visited", "true");
				if (isOnboarding) {
					setTimeout(() => setShowOnboarding(true), 500);
				}
			}
		}
	}, [isOnboarding]);

	useEffect(() => {
		if (isOnboarding && localStorage.getItem("lumni_has_visited") === "true") {
			setShowOnboarding(true);
		}
	}, [isOnboarding]);

	if (showOnboarding) {
		return <OnboardingWizard onComplete={() => setShowOnboarding(false)} />;
	}

	return <>{children}</>;
}

export function useShouldShowOnboarding(): boolean {
	const { isOnboarding } = useOnboarding();
	const [shouldShow, setShouldShow] = useState(false);

	useEffect(() => {
		if (typeof window === "undefined") return;

		const hasProgress = localStorage.getItem("lumni_user_progress");
		const isFirstVisit = !localStorage.getItem("lumni_has_visited");

		if (isFirstVisit || !hasProgress) {
			setShouldShow(isOnboarding);
		}
	}, [isOnboarding]);

	return shouldShow;
}
