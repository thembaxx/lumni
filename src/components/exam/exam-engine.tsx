"use client";

import { List, Spinner } from "@phosphor-icons/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { AssessmentHeader } from "@/components/ui/headers/assessment-header";
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
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [showSubmit, setShowSubmit] = useState(false);
	const initialized = useRef(false);

	const {
		currentPartId,
		answers,
		flags,
		timeRemaining,
		completed,
		startedAt,
		isSubmitting,
		initSession,
		setAnswer,
		toggleFlag,
		setCurrentPart,
		setSubmitting,
		completeSession,
	} = useExamSessionStore();

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
				timeTaken={startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 0}
			/>
		);
	}

	return (
		<div className="h-dvh flex flex-col bg-background">
			<ExamTimer />
			<div className="flex items-start gap-2 px-4 pt-4">
				<Button
					variant="ghost"
					size="sm"
					onClick={() => setSidebarOpen(!sidebarOpen)}
					className="lg:hidden shrink-0 mt-0.5"
				>
					<List data-icon />
					<span className="sr-only">Toggle question list</span>
				</Button>
				<AssessmentHeader
					title={`${paper.metadata.subject} ${paper.metadata.paperCode}`}
					elapsedTime={
						startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 0
					}
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

			<div className="flex flex-1 min-h-0">
				<aside
					className={`w-64 border-r bg-muted/20 shrink-0 overflow-hidden transition-[width,opacity] ${
						sidebarOpen
							? "max-lg:fixed max-lg:inset-0 max-lg:z-50"
							: "max-lg:w-0 max-lg:hidden"
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

				<main className="flex-1 overflow-auto min-w-0">
					<div className="max-w-3xl mx-auto p-4 sm:p-6 flex flex-col gap-8">
						{paper.sections.map((section) => (
							<div key={section.id}>
								<h2 className="text-xl font-extrabold mb-4">
									SECTION {section.id}
									{section.title ? `: ${section.title}` : ""}
								</h2>

								{section.instructions && section.instructions.length > 0 && (
									<div className="mb-4 p-3 bg-muted/50 rounded-lg">
										<p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
											Instructions
										</p>
										<ul className="flex flex-col gap-1">
											{section.instructions.map((inst, idx) => (
												<li key={idx} className="text-xs text-muted-foreground">
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

						<div className="flex justify-center py-6 border-t">
							<Button
								size="lg"
								onClick={() => setShowSubmit(true)}
								disabled={isSubmitting}
							>
								{isSubmitting ? (
									<>
										<Spinner data-icon className="mr-2 animate-spin" />
										Submitting...
									</>
								) : (
									"Submit Exam"
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
	);
}
