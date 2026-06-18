"use client";

import { useTranslations } from "next-intl";
import { EmptyStateWithIllustration } from "@/components/quiz";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { DecorativeRightPanel } from "./decorative-right-panel";

interface QuizErrorStateProps {
	loadError: string;
	onRetry: () => void;
	onBack: () => void;
}

export function QuizErrorState({
	loadError,
	onRetry,
	onBack,
}: QuizErrorStateProps) {
	const t = useTranslations();

	return (
		<div className="grid min-h-dvh grid-cols-12 gap-0 bg-background">
			<div className="col-span-12 col-start-1 flex items-center justify-center p-4 pb-(--space-20) md:col-span-7">
				<Card size="sm" className="w-full max-w-md">
					<CardContent className="flex flex-col gap-4">
						<CardTitle className="font-extrabold text-xl tracking-tight">
							{t("common.error")}
						</CardTitle>
						<EmptyStateWithIllustration
							animation="error"
							title={t("quiz.loadError")}
							description={loadError}
							action={{
								label: t("common.retry"),
								onClick: onRetry,
							}}
							secondaryAction={{
								label: t("common.back"),
								onClick: onBack,
							}}
						/>
					</CardContent>
				</Card>
			</div>
			<DecorativeRightPanel variant="destructive" />
		</div>
	);
}
