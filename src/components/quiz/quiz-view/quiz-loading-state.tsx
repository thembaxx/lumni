"use client";

import RadialIcon from "@hugeicons/core-free-icons/RadialIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { m } from "framer-motion";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { DecorativeRightPanel } from "./decorative-right-panel";

interface QuizLoadingStateProps {
	resolvedTopic?: string;
	topicCompetencyLevel?: string;
	topicCompetencyScore?: number;
}

export function QuizLoadingState({
	resolvedTopic,
	topicCompetencyLevel,
	topicCompetencyScore,
}: QuizLoadingStateProps) {
	const t = useTranslations();

	return (
		<div className="grid min-h-dvh grid-cols-12 gap-0 bg-background">
			<div className="col-span-12 col-start-1 flex items-center justify-center p-4 pb-(--space-20) md:col-span-7">
				<Card size="sm" className="w-full max-w-md">
					<CardContent className="flex flex-col items-center gap-4 p-8 text-left">
						<m.div
							animate={{ rotate: 360 }}
							transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
							className="mx-auto h-3 w-12"
						>
							<HugeiconsIcon
								icon={RadialIcon}
								className="size-12 text-muted-foreground"
							/>
						</m.div>
						<p className="text-muted-foreground">
							{t("quiz.preparingQuestions")}
						</p>
						{resolvedTopic && topicCompetencyLevel && (
							<div className="flex flex-col items-center gap-1">
								<p className="text-muted-foreground text-xs">
									{t("quiz.focusingOn", { topic: resolvedTopic })}
								</p>
								<p className="text-muted-foreground text-xs">
									{t("quiz.level", {
										level: topicCompetencyLevel,
									})}
									{topicCompetencyScore !== undefined &&
										t("quiz.scorePercent", {
											score: topicCompetencyScore,
										})}
								</p>
							</div>
						)}
					</CardContent>
				</Card>
			</div>
			<DecorativeRightPanel />
		</div>
	);
}
