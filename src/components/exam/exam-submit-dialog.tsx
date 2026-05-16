"use client";

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

export function ExamSubmitDialog({
	open,
	onOpenChange,
	onConfirm,
	answeredCount,
	totalParts,
}: ExamSubmitDialogProps) {
	const unanswered = totalParts - answeredCount;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Ready to hand in?</DialogTitle>
					<DialogDescription>
						{unanswered > 0
							? `You still have ${unanswered} unanswered questions. Are you sure you want to finish now?`
							: "You&apos;ve answered all questions. Ready to see how you did?"}
					</DialogDescription>
				</DialogHeader>
				<div className="flex flex-col gap-3 py-2">
					<div className="flex justify-between text-sm">
						<span className="text-muted-foreground">Answered</span>
						<span className="font-medium">
							{answeredCount}/{totalParts}
						</span>
					</div>
					{unanswered > 0 && (
						<div className="flex justify-between text-sm">
							<span className="text-destructive font-semibold">Unanswered</span>
							<span className="font-bold text-destructive">{unanswered}</span>
						</div>
					)}
				</div>
				<div className="flex justify-end gap-3">
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Continue Writing
					</Button>
					<Button
						variant={unanswered > 0 ? "destructive" : "default"}
						onClick={onConfirm}
					>
						Finish & Submit
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
