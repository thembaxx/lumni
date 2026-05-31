"use client";

import { AnimatePresence, m } from "framer-motion";
import { useTranslations } from "next-intl";
import { SessionQuestionNavigator } from "@/components/exam";
import type { QuestionPart } from "@/types/exam-paper";

interface QuestionNavigatorSidebarProps {
	showPalette: boolean;
	flatParts: Array<{
		sectionId: string;
		questionId: string;
		part: QuestionPart;
	}>;
	currentPartId: string | null;
	answers: Record<string, { value: string | string[] }>;
	flags: string[];
	onNavigate: (partId: string) => void;
}

export function QuestionNavigatorSidebar({
	showPalette,
	flatParts,
	currentPartId,
	answers,
	flags,
	onNavigate,
}: QuestionNavigatorSidebarProps) {
	const t = useTranslations();

	return (
		<AnimatePresence initial={false}>
			{showPalette && (
				<m.aside
					initial={{ width: 0, opacity: 0 }}
					animate={{ width: 260, opacity: 1 }}
					exit={{ width: 0, opacity: 0 }}
					className="overflow-hidden border-border border-r bg-muted/20"
				>
					<div className="w-64 p-4">
						<p className="mb-3 font-semibold text-muted-foreground text-xs">
							{t("exam.questionNavigator")}
						</p>
						<SessionQuestionNavigator
							totalParts={flatParts}
							currentPartId={currentPartId}
							answers={answers}
							flags={flags}
							onNavigate={onNavigate}
						/>
					</div>
				</m.aside>
			)}
		</AnimatePresence>
	);
}
