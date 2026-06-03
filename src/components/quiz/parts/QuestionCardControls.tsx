"use client";

import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

interface QuestionCardControlsProps {
	onNext?: () => void;
	questionNumber?: number;
	totalQuestions?: number;
}

export function QuestionCardControls({
	onNext,
	questionNumber,
	totalQuestions,
}: QuestionCardControlsProps) {
	const t = useTranslations();
	return (
		<div className="flex items-center justify-between gap-3">
			<div />
			{onNext && (
				<Button onClick={onNext} className="gap-2">
					{questionNumber != null &&
					totalQuestions != null &&
					questionNumber < totalQuestions
						? t("common.next")
						: t("common.finish")}
					<HugeiconsIcon icon={ArrowRight01Icon} data-icon />
				</Button>
			)}
		</div>
	);
}
