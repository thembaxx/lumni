"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ExamDate as ExamDateType } from "@/lib/utils/study-planner";

export function AddExamModal({
	onClose,
	onAdd,
}: {
	onClose: () => void;
	onAdd: (exam: Omit<ExamDateType, "id" | "daysUntil">) => void;
}) {
	const t = useTranslations();
	const [subject, setSubject] = useState("");
	const [paper, setPaper] = useState("");
	const [date, setDate] = useState("");

	return (
		<Dialog open onOpenChange={(o) => !o && onClose()}>
			<DialogContent className="max-w-md sm:max-w-md">
				<DialogTitle className="font-heading font-medium text-sm">
					{t("studyPlanner.addExamModalTitle")}
				</DialogTitle>
				<div className="flex flex-col gap-4">
					<div>
						<Label>{t("studyPlanner.examSubject")}</Label>
						<Input
							value={subject}
							onChange={(e) => setSubject(e.target.value)}
							placeholder={t("studyPlanner.subjectPlaceholder")}
						/>
					</div>
					<div>
						<Label>{t("studyPlanner.examPaper")}</Label>
						<Input
							value={paper}
							onChange={(e) => setPaper(e.target.value)}
							placeholder={t("studyPlanner.paperPlaceholder")}
						/>
					</div>
					<div>
						<Label>{t("studyPlanner.examDate")}</Label>
						<Input
							type="date"
							value={date}
							onChange={(e) => setDate(e.target.value)}
						/>
					</div>
					<div className="flex gap-2 pt-4">
						<Button variant="outline" onClick={onClose} className="flex-1">
							{t("studyPlanner.cancel")}
						</Button>
						<Button
							onClick={() => {
								if (!subject || !paper || !date) return;
								onAdd({
									subject,
									paper,
									date: new Date(date).getTime(),
								});
							}}
							disabled={!subject || !paper || !date}
							className="flex-1"
						>
							{t("studyPlanner.add")}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
