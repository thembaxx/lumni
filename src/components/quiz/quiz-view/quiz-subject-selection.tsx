"use client";

import { useTranslations } from "next-intl";
import { QuizSelectSubject } from "@/components/quiz";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { DecorativeRightPanel } from "./decorative-right-panel";

interface QuizSubjectSelectionProps {
	onSelect: (subject: string) => void;
}

export function QuizSubjectSelection({ onSelect }: QuizSubjectSelectionProps) {
	const t = useTranslations();

	return (
		<div className="grid min-h-dvh grid-cols-12 gap-0 bg-background">
			<div className="col-span-12 col-start-1 flex items-center justify-center p-4 pb-20 md:col-span-7">
				<Card size="sm" className="w-full max-w-md">
					<CardContent className="flex flex-col gap-4">
						<CardTitle className="ios-title-2 font-extrabold tracking-tight">
							{t("quiz.title")}
						</CardTitle>
						<QuizSelectSubject onSelect={onSelect} />
					</CardContent>
				</Card>
			</div>
			<DecorativeRightPanel />
		</div>
	);
}
