"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GamificationCelebration } from "@/components/celebration";
import { useImmersiveMode } from "@/components/shared/immersive-mode";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useExamPaper } from "@/hooks/use-exam-paper";
import {
	clearSavedSession,
	hasSavedSession,
	useExamSessionAutoSave,
} from "@/hooks/use-exam-session-persistence";
import { useGamification } from "@/hooks/use-gamification";
import { useWrongAnswerJournal } from "@/hooks/use-wrong-answer-journal";
import {
	getAnswerText,
	getCorrectAnswerText,
	parseDuration,
} from "@/lib/exam/helpers";
import { flashcardEngine } from "@/lib/flashcard-engine";
import { trackQuestionResult } from "@/lib/orchestrator";
import { addStudySession, markPlanStale } from "@/lib/utils/study-planner";
import { useExamSessionStore } from "@/store/exam-session";
import { ExamHeader } from "./exam-session/exam-header";
import { ModeSelectScreen } from "./exam-session/mode-select-screen";
import { QuestionDisplay } from "./exam-session/question-display";
import { QuestionNavigatorSidebar } from "./exam-session/question-navigator-sidebar";
import { ResultsScreen } from "./exam-session/results-screen";

interface ExamSessionClientProps {
	id: string;
	mode: "timed" | "practice" | "mock";
}

type SessionPhase =
	| "loading"
	| "mode-select"
	| "active"
	| "submitting"
	| "results"
	| "mock-confirm";

export function ExamSessionWithResume({ id, mode }: ExamSessionClientProps) {
	const t = useTranslations();
	const [resumeData, setResumeData] =
		useState<Awaited<ReturnType<typeof hasSavedSession>>>(null);
	const [resumeChecked, setResumeChecked] = useState(false);

	useEffect(() => {
		hasSavedSession(id).then((data) => {
			setResumeData(data);
			setResumeChecked(true);
		});
	}, [id]);

	const handleResume = useCallback(() => {
		if (!resumeData) return;
		const parsedAnswers = JSON.parse(resumeData.answers as string);
		useExamSessionStore.setState({
			answers: parsedAnswers,
			flags: JSON.parse(resumeData.flags as string),
			currentPartId: resumeData.currentPartId,
			timeRemaining: resumeData.timeRemaining,
			startedAt: resumeData.startedAt,
			completed: false,
			isSubmitting: false,
			paperId: id,
		});
		setResumeData(null);
	}, [resumeData, id]);

	const handleStartNew = useCallback(async () => {
		await clearSavedSession(id);
		setResumeData(null);
	}, [id]);

	if (!resumeChecked) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background">
				<p className="animate-pulse text-muted-foreground">
					{t("exam.checkingSavedSession")}
				</p>
			</div>
		);
	}

	if (resumeData) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background p-4">
				<Dialog open modal>
					<DialogContent className="sm:max-w-md">
						<DialogHeader>
							<DialogTitle>{t("exam.resumeTitle")}</DialogTitle>
							<DialogDescription>
								{t("exam.resumeDescription")}
							</DialogDescription>
						</DialogHeader>
						<div className="flex flex-col gap-3 pt-2">
							<div className="rounded-lg bg-muted p-3 text-sm">
								{resumeData.answers
									? t("exam.questionsAnswered", {
											count: Object.keys(JSON.parse(resumeData.answers)).length,
										})
									: t("exam.noAnswersRecorded")}
							</div>
							<div className="flex flex-col gap-2">
								<Button size="lg" onClick={handleResume}>
									{t("exam.resumeSession")}
								</Button>
								<Button variant="outline" size="lg" onClick={handleStartNew}>
									{t("exam.startNew")}
								</Button>
							</div>
						</div>
					</DialogContent>
				</Dialog>
			</div>
		);
	}

	return <ExamSessionClient id={id} mode={mode} />;
}

export function ExamSessionClient({ id, mode }: ExamSessionClientProps) {
	const t = useTranslations();
	const { data: paperData, isLoading: paperLoading } = useExamPaper(id);
	const [phase, setPhase] = useState<SessionPhase>("loading");
	const [sessionModeOverride, setSessionModeOverride] = useState<
		"timed" | "practice" | "mock" | null
	>(null);
	const sessionMode = sessionModeOverride ?? mode;
	const isMock = sessionMode === "mock";
	const [showPalette, setShowPalette] = useState(false);
	const [paused, setPaused] = useState(false);
	const [tabFocusWarn, setTabFocusWarn] = useState(false);
	const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

	const {
		paper,
		answers,
		flags,
		currentPartId,
		timeRemaining,
		initSession,
		setAnswer,
		toggleFlag,
		setCurrentPart,
		tick,
		completeSession,
		resetSession,
		getFlatParts,
		getAnsweredCount,
		getTotalPartsCount,
	} = useExamSessionStore();

	const {
		addXp,
		updateStreak,
		checkAndUnlockAchievements,
		currentStreak,
		levelInfo,
		totalQuestionsAnswered,
	} = useGamification();

	const { addWrongAnswer } = useWrongAnswerJournal();
	const { setImmersive } = useImmersiveMode();

	useExamSessionAutoSave(id);

	useEffect(() => {
		if (!isMock || phase !== "active") return;
		const handleVisibility = () => {
			if (document.hidden) setTabFocusWarn(true);
		};
		document.addEventListener("visibilitychange", handleVisibility);
		return () =>
			document.removeEventListener("visibilitychange", handleVisibility);
	}, [isMock, phase]);

	const flatParts = useMemo(() => {
		if (!paper) return [];
		return getFlatParts();
	}, [paper, getFlatParts]);

	const sessionInitRef = useRef(false);

	useEffect(() => {
		if (!paperLoading && paperData && !sessionInitRef.current) {
			sessionInitRef.current = true;
			const durationMinutes = parseDuration(paperData.exam.metadata.duration);
			initSession(paperData.exam, paperData.metadata.id, durationMinutes);
			setPhase("mode-select");
		}
	}, [paperLoading, paperData, initSession]);

	useEffect(() => {
		if (
			timeRemaining <= 0 &&
			phase === "active" &&
			(sessionMode === "timed" || isMock)
		) {
			completeSession();
			setPhase("submitting");
		}
		if (phase === "active" && (sessionMode === "timed" || isMock) && !paused) {
			timerRef.current = setInterval(() => {
				tick();
			}, 1000);
		}
		return () => {
			if (timerRef.current) clearInterval(timerRef.current);
		};
	}, [
		phase,
		sessionMode,
		isMock,
		paused,
		tick,
		timeRemaining,
		completeSession,
	]);

	useEffect(() => {
		setImmersive(phase === "active");
		return () => setImmersive(false);
	}, [phase, setImmersive]);

	const startSession = useCallback(() => {
		const first = flatParts[0];
		if (first)
			setCurrentPart(`${first.sectionId}-${first.questionId}-${first.part.id}`);
		setPhase("active");
	}, [flatParts, setCurrentPart]);

	const currentPartIndex = useMemo(
		() =>
			flatParts.findIndex(
				(p) => `${p.sectionId}-${p.questionId}-${p.part.id}` === currentPartId,
			),
		[flatParts, currentPartId],
	);

	const currentPart = useMemo(
		() => (currentPartIndex >= 0 ? flatParts[currentPartIndex] : null),
		[flatParts, currentPartIndex],
	);

	const goToNext = useCallback(() => {
		if (currentPartIndex < flatParts.length - 1) {
			const nextPart = flatParts[currentPartIndex + 1];
			setCurrentPart(
				`${nextPart.sectionId}-${nextPart.questionId}-${nextPart.part.id}`,
			);
		}
	}, [currentPartIndex, flatParts, setCurrentPart]);

	const goToPrevious = useCallback(() => {
		if (isMock) return;
		if (currentPartIndex > 0) {
			const prevPart = flatParts[currentPartIndex - 1];
			setCurrentPart(
				`${prevPart.sectionId}-${prevPart.questionId}-${prevPart.part.id}`,
			);
		}
	}, [currentPartIndex, flatParts, setCurrentPart, isMock]);

	const handleAnswer = useCallback(
		(value: string | string[]) => {
			if (currentPartId) setAnswer(currentPartId, value);
		},
		[currentPartId, setAnswer],
	);

	const handleSubmit = useCallback(async () => {
		setPhase("submitting");
		completeSession();
		if (timerRef.current) clearInterval(timerRef.current);

		const partResults = flatParts.map((item) => {
			const fullId = `${item.sectionId}-${item.questionId}-${item.part.id}`;
			const answer = answers[fullId];
			let correct = false;
			if (item.part.type === "multiple-choice" && item.part.options) {
				const selected = Array.isArray(answer?.value)
					? answer?.value[0]
					: answer?.value;
				correct = item.part.options.some(
					(o) => o.id === selected && o.isCorrect,
				);
			}
			return { partId: fullId, correct, score: correct ? 1 : 0 };
		});

		const correctCount = partResults.filter((r) => r.correct).length;
		const totalCount = partResults.length;
		const accuracy =
			totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

		updateStreak();
		addXp(totalCount, accuracy, currentStreak);
		checkAndUnlockAchievements(
			totalQuestionsAnswered + totalCount,
			accuracy,
			currentStreak,
			levelInfo.level,
			accuracy === 100,
		);

		const flashcardPromises: Promise<unknown>[] = [];
		for (let i = 0; i < flatParts.length; i++) {
			const item = flatParts[i];
			const result = partResults[i];
			const topic = item.sectionId;
			const subject = paperData?.metadata.subject ?? "unknown";

			const maxScore =
				typeof item.part.marks === "number" ? item.part.marks : result.score;
			trackQuestionResult({
				subjectId: subject,
				topicId: topic,
				bloomLevel: "apply",
				score: result.score,
				maxScore,
			});

			if (!result.correct) {
				const partText = item.part.text ?? `Question ${item.questionId}`;
				addWrongAnswer({
					questionId: result.partId,
					questionText: partText,
					subject,
					topic,
					correctAnswer: getCorrectAnswerText(item.part),
					userAnswer: getAnswerText(item.part, answers[result.partId]),
					explanation: "",
				});
				flashcardPromises.push(
					flashcardEngine.create(
						partText,
						getCorrectAnswerText(item.part) || "Review this topic",
						subject,
					),
				);
			}
		}
		await Promise.all(flashcardPromises);

		markPlanStale();

		const weakCount = partResults.filter((r) => !r.correct).length;
		if (weakCount > 0) {
			const now = Date.now();
			addStudySession({
				subject: paperData?.metadata.subject ?? "unknown",
				type: "exam",
				scheduledAt: now + 24 * 60 * 60 * 1000,
				duration: Math.min(weakCount * 5, 45),
				completed: false,
			});
		}

		setPhase("results");
	}, [
		flatParts,
		answers,
		completeSession,
		updateStreak,
		addXp,
		currentStreak,
		checkAndUnlockAchievements,
		totalQuestionsAnswered,
		levelInfo.level,
		paperData,
		addWrongAnswer,
	]);

	const handleDashboard = useCallback(() => {
		resetSession();
		window.history.back();
	}, [resetSession]);

	if (paperLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background">
				<p className="animate-pulse text-muted-foreground">
					{t("exam.loadingExam")}
				</p>
			</div>
		);
	}

	if (!paperData && !paperLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background p-4">
				<Card>
					<CardContent className="p-8 text-center">
						<p className="font-medium text-destructive">{t("exam.notFound")}</p>
						<Button className="mt-4" onClick={handleDashboard}>
							{t("exam.goBack")}
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (phase === "mode-select") {
		return (
			<ModeSelectScreen
				subject={paperData?.exam.metadata.subject ?? ""}
				paperCode={paperData?.exam.metadata.paperCode ?? ""}
				year={paperData?.exam.metadata.year ?? ""}
				examPeriod={paperData?.exam.metadata.examPeriod ?? ""}
				totalMarks={paperData?.exam.metadata.totalMarks ?? 0}
				duration={paperData?.exam.metadata.duration ?? ""}
				onStartPractice={startSession}
				onStartTimed={() => {
					setSessionModeOverride("timed");
					startSession();
				}}
				onStartMock={() => {
					setSessionModeOverride("mock");
					setPhase("mock-confirm");
				}}
			/>
		);
	}

	if (phase === "mock-confirm") {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background p-4">
				<Dialog open modal>
					<DialogContent className="sm:max-w-md">
						<DialogHeader>
							<DialogTitle>{t("exam.mockExamTitle")}</DialogTitle>
							<DialogDescription>
								{t("exam.mockExamDescription")}
							</DialogDescription>
						</DialogHeader>
						<ul className="flex flex-col gap-2 text-muted-foreground text-sm">
							<li className="flex items-start gap-2">
								<span className="mt-0.5 text-warning">\u26A0</span>
								<span>{t("exam.mockRuleNoPause")}</span>
							</li>
							<li className="flex items-start gap-2">
								<span className="mt-0.5 text-warning">\u26A0</span>
								<span>{t("exam.mockRuleNoBack")}</span>
							</li>
							<li className="flex items-start gap-2">
								<span className="mt-0.5 text-warning">\u26A0</span>
								<span>{t("exam.mockRuleNoHints")}</span>
							</li>
							<li className="flex items-start gap-2">
								<span className="mt-0.5 text-warning">\u26A0</span>
								<span>{t("exam.mockRuleTabFocus")}</span>
							</li>
						</ul>
						<div className="flex flex-col gap-2 pt-2">
							<Button size="lg" onClick={startSession}>
								{t("exam.beginExam")}
							</Button>
							<Button
								variant="outline"
								size="lg"
								onClick={() => setPhase("mode-select")}
							>
								{t("exam.goBack")}
							</Button>
						</div>
					</DialogContent>
				</Dialog>
			</div>
		);
	}

	if (phase === "results") {
		return (
			<ResultsScreen
				flatParts={flatParts}
				answers={answers}
				subject={paperData?.exam.metadata.subject ?? ""}
				totalMarks={paperData?.exam.metadata.totalMarks ?? 0}
				duration={paperData?.exam.metadata.duration ?? ""}
				mode={sessionMode}
				onDashboard={handleDashboard}
				onReview={() => {
					resetSession();
					window.location.href = "/flashcards";
				}}
			/>
		);
	}

	const answeredCount = getAnsweredCount();
	const totalPartsCount = getTotalPartsCount();

	return (
		<div className="flex min-h-screen flex-col bg-background">
			{tabFocusWarn && (
				<div className="sticky top-0 z-modal flex items-center justify-center bg-warning p-2 text-center font-medium text-sm text-warning-foreground">
					{t("exam.mockTabFocusWarn")}
				</div>
			)}

			<ExamHeader
				paperCode={paperData?.exam.metadata.paperCode}
				sessionMode={sessionMode}
				answeredCount={answeredCount}
				totalPartsCount={totalPartsCount}
				currentPartIndex={currentPartIndex}
				timeRemaining={timeRemaining}
				paused={paused}
				onBack={() => setPhase("submitting")}
				onTogglePause={() => setPaused((p) => !p)}
				onTogglePalette={() => setShowPalette((p) => !p)}
				onSubmit={handleSubmit}
			/>

			<div className="flex flex-1">
				{!isMock && (
					<QuestionNavigatorSidebar
						showPalette={showPalette}
						flatParts={flatParts}
						currentPartId={currentPartId}
						answers={answers}
						flags={flags}
						onNavigate={(partId) => {
							setCurrentPart(partId);
							setShowPalette(false);
						}}
					/>
				)}

				<QuestionDisplay
					currentPart={currentPart}
					currentPartId={currentPartId}
					currentPartIndex={currentPartIndex}
					totalPartsCount={totalPartsCount}
					answers={answers}
					flags={flags}
					paused={paused}
					isMock={isMock}
					onAnswer={handleAnswer}
					onToggleFlag={toggleFlag}
					onPrevious={goToPrevious}
					onNext={goToNext}
					onSubmit={handleSubmit}
				/>
			</div>
			<GamificationCelebration />
		</div>
	);
}
