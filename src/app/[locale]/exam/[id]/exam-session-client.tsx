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
import { Skeleton } from "@/components/ui/skeleton";
import { useTrackExamEvents } from "@/hooks/use-analytics-tracking";
import { useExamPaper } from "@/hooks/use-exam-paper";
import {
	clearSavedSession,
	hasSavedSession,
	useExamSessionAutoSave,
} from "@/hooks/use-exam-session-persistence";
import { useExamSessionSync } from "@/hooks/use-exam-session-sync";
import { useGamification } from "@/hooks/use-gamification";
import { useNavigationDirection } from "@/hooks/use-navigation-direction";
import { useWrongAnswerJournal } from "@/hooks/use-wrong-answer-journal";
import { useRouter } from "@/i18n/navigation";
import {
	getAnswerText,
	getCorrectAnswerText,
	parseDuration,
} from "@/lib/exam/helpers";
import { flashcardEngine } from "@/lib/flashcard-engine";
import { enqueue } from "@/lib/orchestrator/job-queue";
import { trackQuestionResult } from "@/lib/orchestrator/track-result";
import {
	processQuizResult,
	type QuizResultDeps,
} from "@/lib/services/quiz-result-processor";
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
				<Skeleton className="h-4 w-48" />
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

function ExamSessionClient({ id, mode }: ExamSessionClientProps) {
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
		checkForRewardChests,
		currentStreak,
		levelInfo,
		totalQuestionsAnswered,
	} = useGamification();

	const { addWrongAnswer } = useWrongAnswerJournal();
	const { setImmersive } = useImmersiveMode();
	const { trackExamStart, trackExamComplete } = useTrackExamEvents();

	const quizResultDeps: QuizResultDeps = useMemo(
		() => ({
			updateStreak,
			addXp,
			checkAndUnlockAchievements,
			checkForRewardChests,
			addWrongAnswer,
			flashcardEngine,
			trackQuestionResult,
			enqueue,
			addStudySession,
			markPlanStale,
			currentStreak,
			totalQuestionsAnswered,
			levelInfo,
		}),
		[
			updateStreak,
			addXp,
			checkAndUnlockAchievements,
			checkForRewardChests,
			addWrongAnswer,
			currentStreak,
			totalQuestionsAnswered,
			levelInfo,
		],
	);

	useExamSessionSync();
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

	const initializedPaperIdRef = useRef<string | null>(null);
	if (
		!paperLoading &&
		paperData &&
		paperData.metadata.id !== initializedPaperIdRef.current
	) {
		initializedPaperIdRef.current = paperData.metadata.id;
		const durationMinutes = parseDuration(paperData.exam.metadata.duration);
		initSession(paperData.exam, paperData.metadata.id, durationMinutes);
		setPhase("mode-select");
	}

	useEffect(() => {
		if (phase === "active" && (sessionMode === "timed" || isMock) && !paused) {
			timerRef.current = setInterval(() => {
				tick();
			}, 1000);
		}
		return () => {
			if (timerRef.current) {
				clearInterval(timerRef.current);
				timerRef.current = null;
			}
		};
	}, [phase, sessionMode, isMock, paused, tick]);

	const completionRef = useRef(false);
	if (
		timeRemaining <= 0 &&
		phase === "active" &&
		(sessionMode === "timed" || isMock) &&
		!completionRef.current
	) {
		completionRef.current = true;
		completeSession();
		setPhase("submitting");
	}
	if (phase !== "active") {
		completionRef.current = false;
	}

	useEffect(() => {
		setImmersive(phase === "active");
		return () => setImmersive(false);
	}, [phase, setImmersive]);

	const startSession = useCallback(() => {
		const first = flatParts[0];
		if (first)
			setCurrentPart(`${first.sectionId}-${first.questionId}-${first.part.id}`);
		trackExamStart(
			paperData?.metadata.subject ?? "unknown",
			paperData?.metadata.id,
		);
		setPhase("active");
	}, [flatParts, setCurrentPart, paperData, trackExamStart]);

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

		const examParts = flatParts.map((item) => {
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
			return {
				partId: fullId,
				correct,
				score: correct ? 1 : 0,
				sectionId: item.sectionId,
				questionId: item.questionId,
				part: item.part,
				userAnswer: getAnswerText(item.part, answers[fullId]),
				correctAnswerText: getCorrectAnswerText(item.part),
			};
		});

		const correctCount = examParts.filter((p) => p.correct).length;
		trackExamComplete(
			paperData?.metadata.subject ?? "unknown",
			correctCount,
			examParts.length,
		);

		await processQuizResult(
			{
				source: "exam",
				parts: examParts,
				subject: paperData?.metadata.subject ?? "unknown",
				paperId: paperData?.metadata.id,
			},
			quizResultDeps,
		);

		setPhase("results");
	}, [
		flatParts,
		answers,
		completeSession,
		paperData,
		quizResultDeps,
		trackExamComplete,
	]);

	const { back } = useRouter();
	const { push } = useNavigationDirection();

	const handleDashboard = useCallback(() => {
		resetSession();
		back();
	}, [resetSession, back]);

	if (paperLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background">
				<Skeleton className="h-4 w-32" />
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
					push("/flashcards");
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
