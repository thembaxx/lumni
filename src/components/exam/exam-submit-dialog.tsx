"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

interface ExamSubmitDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
	answeredCount: number;
	totalParts: number;
}

function _ExamSubmitDialog({
	open,
	onOpenChange,
	onConfirm,
	answeredCount,
	totalParts,
}: ExamSubmitDialogProps) {
	const t = useTranslations();
	const unanswered = totalParts - answeredCount;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{t("exam.readyToHandIn")}</DialogTitle>
					<DialogDescription>
						{unanswered > 0
							? t("exam.unansweredWarning", { unanswered })
							: t("exam.allAnswered")}
					</DialogDescription>
				</DialogHeader>
				<div className="flex flex-col gap-3 py-2">
					<div className="flex justify-between text-sm">
						<span className="text-muted-foreground">{t("exam.answered")}</span>
						<span className="font-medium">
							{answeredCount}/{totalParts}
						</span>
					</div>
					{unanswered > 0 && (
						<div className="flex justify-between text-sm">
							<span className="font-semibold text-destructive">
								{t("exam.unanswered")}
							</span>
							<span className="font-bold text-destructive">{unanswered}</span>
						</div>
					)}
				</div>
				<div className="flex justify-end gap-3">
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						{t("exam.continueWriting")}
					</Button>
					<Button
						variant={unanswered > 0 ? "destructive" : "default"}
						onClick={onConfirm}
					>
						{t("exam.finishSubmit")}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
