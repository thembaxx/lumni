"use client";

import Login01Icon from "@hugeicons/core-free-icons/Login01Icon";
import { useTranslations } from "next-intl";
import { useCallback } from "react";
import { EmptyStateWithIllustration } from "@/components/shared/empty-state";
import { useNavigationDirection } from "@/hooks/use-navigation-direction";

export function AnonymousUpsell() {
	const t = useTranslations();
	const { push } = useNavigationDirection();
	const handleSignIn = useCallback(() => {
		push("/auth/sign-in?redirect=/dashboard");
	}, [push]);
	const handleSignUp = useCallback(() => {
		push("/auth/sign-up?redirect=/dashboard");
	}, [push]);
	return (
		<div className="rounded-4xl border border-dashed bg-system-surface p-8 shadow-level-1">
			<EmptyStateWithIllustration
				icon={Login01Icon}
				title={t("dashboard.signInTitle")}
				description={t("dashboard.signInDescription")}
				action={{
					label: t("dashboard.signInAction"),
					onClick: handleSignIn,
				}}
				secondaryAction={{
					label: t("dashboard.createAccount"),
					onClick: handleSignUp,
				}}
			/>
		</div>
	);
}
