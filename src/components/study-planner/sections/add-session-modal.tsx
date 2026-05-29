"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { StudySession as StudySessionType } from "@/lib/utils/study-planner";

// TODO(react-doctor): Refactor multiple useState calls into useReducer
export function AddSessionModal({
	onClose,
	onAdd,
}: {
	onClose: () => void;
	onAdd: (session: Omit<StudySessionType, "id">) => void;
}) {
	const t = useTranslations();
	const [subject, setSubject] = useState("");
	const [topic, setTopic] = useState("");
	const [type, setType] = useState<"flashcard" | "exam" | "quiz" | "review">(
		"quiz",
	);
	const [duration, setDuration] = useState(30);
	const [defaultTime] = useState(() => Date.now() + 60 * 60 * 1000);
	const [repeat, setRepeat] = useState<"none" | "daily" | "weekly">("none");

	return (
		<div className="fixed inset-0 z-modal flex items-center justify-center bg-black/50">
			<div className="w-full max-w-md overflow-hidden rounded-card-lg border border-border/80 bg-card shadow-level-2 transition-colors">
				<header>
					<h2 className="font-heading font-medium text-sm">
						{t("studyPlanner.addSessionModalTitle")}
					</h2>
				</header>
				<div className="flex flex-col gap-4 px-4 group-data-[size=sm]/card:px-3">
					<div>
						<Label>{t("studyPlanner.sessionSubject")}</Label>
						<Input
							value={subject}
							onChange={(e) => setSubject(e.target.value)}
							placeholder={t("studyPlanner.subjectPlaceholder")}
						/>
					</div>
					<div>
						<Label>{t("studyPlanner.sessionTopic")}</Label>
						<Input
							value={topic}
							onChange={(e) => setTopic(e.target.value)}
							placeholder={t("studyPlanner.topicPlaceholder")}
						/>
					</div>
					<div>
						<Label>{t("studyPlanner.sessionType")}</Label>
						<Select
							value={type}
							onValueChange={(v) =>
								setType(v as "flashcard" | "exam" | "quiz" | "review")
							}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="quiz">
									{t("studyPlanner.typeQuiz")}
								</SelectItem>
								<SelectItem value="flashcard">
									{t("studyPlanner.typeFlashcard")}
								</SelectItem>
								<SelectItem value="exam">
									{t("studyPlanner.typeExamPaper")}
								</SelectItem>
								<SelectItem value="review">
									{t("studyPlanner.typeReview")}
								</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div>
						<Label>{t("studyPlanner.sessionDuration")}</Label>
						<Input
							type="number"
							value={duration}
							onChange={(e) => setDuration(parseInt(e.target.value, 10) || 30)}
							min={5}
							max={120}
						/>
					</div>
					<div>
						<Label>{t("studyPlanner.sessionRepeat")}</Label>
						<Select
							value={repeat}
							onValueChange={(v) => setRepeat(v as "none" | "daily" | "weekly")}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="none">
									{t("studyPlanner.repeatNone")}
								</SelectItem>
								<SelectItem value="daily">
									{t("studyPlanner.repeatDaily")}
								</SelectItem>
								<SelectItem value="weekly">
									{t("studyPlanner.repeatWeekly")}
								</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="flex gap-2 pt-4">
						<Button variant="outline" onClick={onClose} className="flex-1">
							{t("studyPlanner.cancel")}
						</Button>
						<Button
							onClick={() =>
								onAdd({
									subject,
									topic: topic || undefined,
									type,
									scheduledAt: defaultTime,
									duration,
									completed: false,
									repeat,
								})
							}
							disabled={!subject}
							className="flex-1"
						>
							{t("studyPlanner.add")}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
