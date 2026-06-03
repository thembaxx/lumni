"use client";

import { ListViewIcon, RadialIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ContentLock } from "@/components/ui/content-lock";
import { AssessmentHeader } from "@/components/ui/headers/assessment-header";
import { useExamSessionAutoSave } from "@/hooks/use-exam-session-persistence";
import { useExamSessionStore } from "@/store/exam-session";
import type { ExamPaper } from "@/types/exam-paper";
import { ExamResults } from "./exam-results";
import { ExamSidebar } from "./exam-sidebar";
import { ExamSubmitDialog } from "./exam-submit-dialog";
import { ExamTimer } from "./exam-timer";
import { QuestionRenderer } from "./question-renderer";

interface ExamEngineProps {
	paper: ExamPaper;
	paperId: string;
	durationMinutes: number;
}

export function ExamEngine({
	paper,
	paperId,
	durationMinutes,
}: ExamEngineProps) {
	const t = useTranslations();
	const [sidebarOpen, setSidebarOpen] = useState(false);

	useExamSessionAutoSave(paperId);
	const [showSubmit, setShowSubmit] = useState(false);
	const [now] = useState(() => Date.now());
	const initialized = useRef(false);

	const currentPartId = useExamSessionStore((s) => s.currentPartId);
	const answers = useExamSessionStore((s) => s.answers);
	const flags = useExamSessionStore((s) => s.flags);
	const timeRemaining = useExamSessionStore((s) => s.timeRemaining);
	const completed = useExamSessionStore((s) => s.completed);
	const startedAt = useExamSessionStore((s) => s.startedAt);
	const isSubmitting = useExamSessionStore((s) => s.isSubmitting);
	const initSession = useExamSessionStore((s) => s.initSession);
	const setAnswer = useExamSessionStore((s) => s.setAnswer);
	const toggleFlag = useExamSessionStore((s) => s.toggleFlag);
	const setCurrentPart = useExamSessionStore((s) => s.setCurrentPart);
	const setSubmitting = useExamSessionStore((s) => s.setSubmitting);
	const completeSession = useExamSessionStore((s) => s.completeSession);

	useEffect(() => {
		if (!initialized.current) {
			initialized.current = true;
			initSession(paper, paperId, durationMinutes);
		}
	}, [paper, paperId, durationMinutes, initSession]);

	useEffect(() => {
		if (timeRemaining <= 0 && !completed) {
			completeSession();
		}
	}, [timeRemaining, completed, completeSession]);

	const handleAnswer = useCallback(
		(partId: string, value: string | string[]) => {
			setAnswer(partId, value);
		},
		[setAnswer],
	);

	const handleFlag = useCallback(
		(partId: string) => {
			toggleFlag(partId);
		},
		[toggleFlag],
	);

	const handleNavigate = useCallback(
		(partId: string) => {
			setCurrentPart(partId);
			setSidebarOpen(false);
			const el = document.getElementById(partId);
			if (el) {
				el.scrollIntoView({ behavior: "smooth", block: "center" });
			}
		},
		[setCurrentPart],
	);

	const handleSubmit = useCallback(async () => {
		setSubmitting(true);
		setShowSubmit(false);
		completeSession();
		try {
			await fetch("/api/exam-sessions", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					paperId,
					answers,
					flags,
					timeRemaining,
					startedAt: startedAt ? new Date(startedAt).toISOString() : null,
				}),
			});
		} catch {
			// Offline - save succeeded locally
		}
	}, [
		paperId,
		answers,
		flags,
		timeRemaining,
		startedAt,
		setSubmitting,
		completeSession,
	]);

	const totalParts = paper.sections.reduce(
		(sum, s) => sum + s.questions.reduce((qsum, q) => qsum + q.parts.length, 0),
		0,
	);
	const answeredCount = Object.keys(answers).length;

	if (completed) {
		return (
			<ExamResults
				paper={paper}
				answers={answers}
				flags={flags}
				timeTaken={startedAt ? Math.floor((now - startedAt) / 1000) : 0}
			/>
		);
	}

	return (
		<ContentLock feature="exam-simulator">
			<div className="flex h-dvh flex-col bg-background">
				<ExamTimer />
				<div className="flex items-start gap-2 px-4 pt-4">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setSidebarOpen(!sidebarOpen)}
						className="mt-0.5 shrink-0 lg:hidden"
					>
						<HugeiconsIcon icon={ListViewIcon} data-icon />
						<span className="sr-only">{t("exam.toggleQuestionList")}</span>
					</Button>
					<AssessmentHeader
						title={t("exam.engineTitle", {
							subject: paper.metadata.subject,
							paperCode: paper.metadata.paperCode,
						})}
						elapsedTime={startedAt ? Math.floor((now - startedAt) / 1000) : 0}
						currentQuestionIndex={answeredCount}
						totalQuestions={totalParts}
						progressValue={
							totalParts > 0 ? (answeredCount / totalParts) * 100 : 0
						}
						showMarks={true}
						marks={paper.metadata.totalMarks}
						totalMarks={paper.metadata.totalMarks}
						timeRemaining={timeRemaining}
						className="flex-1"
					/>
				</div>

				<div className="flex min-h-0 flex-1">
					<aside
						className={`w-64 shrink-0 overflow-hidden border-r bg-muted/20 transition-[width,opacity] ${
							sidebarOpen
								? "max-lg:fixed max-lg:inset-0 max-lg:z-modal"
								: "max-lg:hidden max-lg:w-0"
						}`}
					>
						<ExamSidebar
							paper={paper}
							answers={answers}
							flags={flags}
							currentPartId={currentPartId}
							onNavigate={handleNavigate}
							onClose={() => setSidebarOpen(false)}
						/>
					</aside>

					<main className="min-w-0 flex-1 overflow-auto">
						<div className="mx-auto flex max-w-3xl flex-col gap-8 p-4 sm:p-6">
							{paper.sections.map((section) => (
								<div key={section.id}>
									<h2 className="mb-4 font-semibold text-xl">
										{t("exam.sectionTitle", { id: section.id })}
										{section.title ? `: ${section.title}` : ""}
									</h2>

									{section.instructions && section.instructions.length > 0 && (
										<div className="mb-4 rounded-lg bg-muted/50 p-3">
											<p className="mb-1 font-semibold text-muted-foreground text-xs uppercase">
												{t("exam.instructions")}
											</p>
											<ul className="flex flex-col gap-1">
												{section.instructions.map((inst) => (
													<li
														key={inst}
														className="text-muted-foreground text-xs"
													>
														{inst}
													</li>
												))}
											</ul>
										</div>
									)}

									{section.questions.map((question) => (
										<QuestionRenderer
											key={question.id}
											question={question}
											sectionId={section.id}
											subject={paper.metadata.subject}
											answers={answers}
											flags={flags}
											currentPartId={currentPartId}
											onAnswer={handleAnswer}
											onFlag={handleFlag}
										/>
									))}
								</div>
							))}

							<div className="flex justify-center border-t py-6">
								<Button
									size="lg"
									onClick={() => setShowSubmit(true)}
									disabled={isSubmitting}
								>
									{isSubmitting ? (
										<>
											<HugeiconsIcon
												icon={RadialIcon}
												data-icon
												className="mr-2 animate-spin"
											/>
											{t("exam.submitting")}
										</>
									) : (
										t("exam.submitExam")
									)}
								</Button>
							</div>
						</div>
					</main>
				</div>

				<ExamSubmitDialog
					open={showSubmit}
					onOpenChange={setShowSubmit}
					onConfirm={handleSubmit}
					answeredCount={answeredCount}
					totalParts={totalParts}
				/>
			</div>
		</ContentLock>
	);
}
