"use client";

import {
	ArrowLeft01Icon,
	ArrowRight01Icon,
	Clock01Icon,
	Flag01Icon,
	Home01Icon,
	Pause,
	PlayFreeIcons,
	RefreshIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, m } from "framer-motion";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Confetti, GamificationCelebration } from "@/components/celebration";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { ShareResultButton } from "@/components/shared/share-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { trackQuestionResult } from "@/lib/orchestrator";
import { cn } from "@/lib/shared";
import { getAPSForSubject, getGrade } from "@/lib/shared/aps";
import { formatTime } from "@/lib/shared/time";
import { iOSEase } from "@/lib/utils/animation";
import { createFlashcard } from "@/lib/utils/spaced-repetition";
import { addStudySession } from "@/lib/utils/study-planner";
import { useExamSessionStore } from "@/store/exam-session";
import type { QuestionPart } from "@/types/exam-paper";

interface ExamSessionClientProps {
	id: string;
	mode: "timed" | "practice";
}

function parseDuration(duration: string): number {
	const lower = duration.toLowerCase();
	const hourMatch = lower.match(/(\d+)\s*hour/);
	const minMatch = lower.match(/(\d+)\s*min/);
	let total = 0;
	if (hourMatch) total += parseInt(hourMatch[1], 10) * 60;
	if (minMatch) total += parseInt(minMatch[1], 10);
	return total || 180;
}

function getCorrectAnswerText(part: QuestionPart): string {
	if (part.options) {
		const correct = part.options.find((o) => o.isCorrect);
		return correct ? `${correct.id}. ${correct.text}` : "";
	}
	return "";
}

function getAnswerText(
	part: QuestionPart,
	answer: { value: string | string[] } | undefined,
): string {
	if (!answer) return "";
	const value = answer.value;
	if (Array.isArray(value)) return value.join(", ");
	if (part.options) {
		const opt = part.options.find((o) => o.id === value);
		return opt ? `${opt.id}. ${opt.text}` : value;
	}
	return value;
}

type SessionPhase =
	| "loading"
	| "mode-select"
	| "active"
	| "submitting"
	| "results";

function PartAnswerInput({
	part,
	value,
	onChange,
	disabled,
}: {
	part: QuestionPart;
	value: string | string[];
	onChange: (value: string | string[]) => void;
	disabled: boolean;
}) {
	const t = useTranslations();
	if (part.type === "multiple-choice" && part.options) {
		const selected = Array.isArray(value) ? value[0] : value;
		return (
			<div className="flex flex-col gap-2">
				{part.options.map((opt) => (
					<button
						key={opt.id}
						type="button"
						disabled={disabled}
						onClick={() => onChange(opt.id)}
						className={cn(
							"w-full rounded-xl border-2 p-3 text-left transition-[border-color,background-color]",
							selected === opt.id
								? "border-[--system-accent] bg-[--system-accent]/5"
								: "border-border hover:border-[--system-accent]/30",
						)}
					>
						<span className="font-medium">{opt.id}.</span>{" "}
						<MarkdownRenderer content={opt.text} />
					</button>
				))}
			</div>
		);
	}

	if (part.subParts) {
		return (
			<div className="flex flex-col gap-4">
				{part.subParts.map((subPart) => (
					<div key={subPart.id}>
						<MarkdownRenderer content={subPart.text ?? ""} />
						<div className="mt-2">
							<PartAnswerInput
								part={subPart}
								value={value}
								onChange={onChange}
								disabled={disabled}
							/>
						</div>
					</div>
				))}
			</div>
		);
	}

	if (part.type === "short-answer") {
		return (
			<input
				type="text"
				value={(Array.isArray(value) ? value[0] : value) ?? ""}
				onChange={(e) => onChange(e.target.value)}
				disabled={disabled}
				className="w-full rounded-xl border-2 border-border bg-background p-3 outline-none focus:border-[--system-accent]"
				placeholder={t("exam.placeholderShortAnswer")}
				aria-label="Short answer input"
			/>
		);
	}

	if (part.type === "long-answer" || part.type === "essay") {
		return (
			<textarea
				value={(Array.isArray(value) ? value[0] : value) ?? ""}
				onChange={(e) => onChange(e.target.value)}
				disabled={disabled}
				rows={6}
				className="w-full resize-y rounded-xl border-2 border-border bg-background p-3 outline-none focus:border-[--system-accent]"
				placeholder={t("exam.placeholderLongAnswer")}
				aria-label="Long answer input"
			/>
		);
	}

	if (part.type === "calculation") {
		return (
			<input
				type="text"
				inputMode="decimal"
				value={(Array.isArray(value) ? value[0] : value) ?? ""}
				onChange={(e) => onChange(e.target.value)}
				disabled={disabled}
				className="w-full rounded-xl border-2 border-border bg-background p-3 font-mono outline-none focus:border-[--system-accent]"
				placeholder={t("exam.placeholderCalculation")}
				aria-label="Calculation answer input"
			/>
		);
	}

	if (part.type === "matching") {
		return (
			<input
				type="text"
				value={(Array.isArray(value) ? value[0] : value) ?? ""}
				onChange={(e) => onChange(e.target.value)}
				disabled={disabled}
				className="w-full rounded-xl border-2 border-border bg-background p-3 outline-none focus:border-[--system-accent]"
				placeholder={t("exam.placeholderMatching")}
				aria-label="Matching pairs input"
			/>
		);
	}

	if (part.type === "diagram") {
		const instructions =
			((part as unknown as Record<string, unknown>).instructions as string) ??
			t("exam.placeholderDiagram");
		return (
			<div className="flex flex-col gap-2">
				<p className="text-muted-foreground text-sm">{instructions}</p>
				<textarea
					value={(Array.isArray(value) ? value[0] : value) ?? ""}
					onChange={(e) => onChange(e.target.value)}
					disabled={disabled}
					rows={4}
					className="w-full resize-y rounded-xl border-2 border-border bg-background p-3 outline-none focus:border-[--system-accent]"
					placeholder={t("exam.placeholderShortAnswer")}
					aria-label="Diagram answer input"
				/>
			</div>
		);
	}

	if (part.type === "programming") {
		return (
			<textarea
				value={(Array.isArray(value) ? value[0] : value) ?? ""}
				onChange={(e) => onChange(e.target.value)}
				disabled={disabled}
				rows={8}
				className="w-full resize-y rounded-xl border-2 border-border bg-background p-3 font-mono text-sm outline-none focus:border-[--system-accent]"
				placeholder={t("exam.placeholderCode")}
				aria-label="Programming answer input"
			/>
		);
	}

	if (
		part.type === "source-based" ||
		part.type === "data-response" ||
		part.type === "mixed"
	) {
		return (
			<textarea
				value={(Array.isArray(value) ? value[0] : value) ?? ""}
				onChange={(e) => onChange(e.target.value)}
				disabled={disabled}
				rows={4}
				className="w-full resize-y rounded-xl border-2 border-border bg-background p-3 outline-none focus:border-[--system-accent]"
				placeholder={t("exam.placeholderShortAnswer")}
				aria-label="Response input"
			/>
		);
	}

	return (
		<div className="flex flex-col gap-2">
			<p className="text-muted-foreground text-sm">
				{t("exam.unsupportedType", { type: part.type })}
			</p>
			<textarea
				value={(Array.isArray(value) ? value[0] : value) ?? ""}
				onChange={(e) => onChange(e.target.value)}
				disabled={disabled}
				rows={4}
				className="w-full resize-y rounded-xl border-2 border-border bg-background p-3 outline-none focus:border-[--system-accent]"
				placeholder={t("exam.placeholderShortAnswer")}
				aria-label="Freeform answer input"
			/>
		</div>
	);
}

function QuestionNavigator({
	totalParts,
	currentPartId,
	answers,
	flags,
	onNavigate,
}: {
	totalParts: { sectionId: string; questionId: string; part: QuestionPart }[];
	currentPartId: string | null;
	answers: Record<string, { value: string | string[] }>;
	flags: string[];
	onNavigate: (partId: string) => void;
}) {
	const groups: Record<string, typeof totalParts> = {};
	for (const item of totalParts) {
		const key = `${item.sectionId}-${item.questionId}`;
		if (!groups[key]) groups[key] = [];
		groups[key].push(item);
	}

	return (
		<div className="flex max-h-80 flex-col gap-2 overflow-y-auto">
			{Object.entries(groups).map(([key, items]) => {
				return (
					<div key={key} className="flex flex-wrap gap-1.5">
						{items.map((item) => {
							const isCurrent = item.part.id === currentPartId;
							const isAnswered = !!answers[item.part.id];
							const isFlagged = flags.includes(item.part.id);
							const partSuffix = item.part.id.split("-").pop() ?? "";
							const label = `${item.questionId}.${partSuffix}`;
							return (
								<button
									key={item.part.id}
									type="button"
									onClick={() => onNavigate(item.part.id)}
									className={cn(
										"size-8 rounded-lg font-medium text-xs transition-colors",
										isCurrent && "ring-2 ring-[--system-accent]",
										isAnswered && !isCurrent && "bg-success/20 text-success",
										!isAnswered &&
											!isCurrent &&
											"bg-muted text-muted-foreground",
										isFlagged && "ring-1 ring-warning",
									)}
								>
									{label}
								</button>
							);
						})}
					</div>
				);
			})}
		</div>
	);
}

function ExamResults({
	results,
	flatParts,
	answers,
	metadata: _metadata,
	onDashboard,
	onReview,
}: {
	results: {
		partResults: { partId: string; correct: boolean; score: number }[];
	};
	flatParts: { sectionId: string; questionId: string; part: QuestionPart }[];
	answers: Record<string, { value: string | string[] }>;
	metadata: { subject: string; totalMarks: number; duration: string };
	onDashboard: () => void;
	onReview?: () => void;
}) {
	const t = useTranslations();
	const [expandedId, setExpandedId] = useState<string | null>(null);
	const correctCount = results.partResults.filter((r) => r.correct).length;
	const totalCount = results.partResults.length;
	const accuracy =
		totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

	const resultMap = useMemo(
		() => new Map(results.partResults.map((r) => [r.partId, r])),
		[results.partResults],
	);

	const failedCount = totalCount - correctCount;

	return (
		<m.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			className="flex min-h-screen flex-col gap-6 bg-background p-4 pb-24"
		>
			<Confetti trigger={accuracy >= 70} count={60} duration={2500} />
			<Card>
				<CardHeader>
					<CardTitle className="font-extrabold text-xl">
						{accuracy >= 80
							? t("exam.greatJob")
							: accuracy >= 50
								? t("exam.goodEffort")
								: t("exam.keepPracticing")}
					</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-col gap-4">
					<div className="grid grid-cols-4 gap-3">
						<div className="rounded-lg bg-muted p-3 text-center">
							<p className="font-extrabold text-2xl text-success tabular-nums">
								{correctCount}
							</p>
							<p className="text-muted-foreground text-xs">{t("exam.correct")}</p>
						</div>
						<div className="rounded-lg bg-muted p-3 text-center">
							<p className="font-extrabold text-2xl text-destructive tabular-nums">
								{failedCount}
							</p>
							<p className="text-muted-foreground text-xs">{t("exam.incorrect")}</p>
						</div>
						<div className="rounded-lg bg-muted p-3 text-center">
							<p className="font-extrabold text-2xl tabular-nums">
								{accuracy}%
							</p>
							<p className="text-muted-foreground text-xs">{t("exam.accuracy")}</p>
						</div>
						{(() => {
							const aps = getAPSForSubject(accuracy);
							return (
								<div className="rounded-lg bg-muted p-3 text-center">
									<p
										className={cn(
											"font-extrabold text-2xl tabular-nums",
											aps >= 6 && "text-success",
											aps >= 4 && aps < 6 && "text-warning",
											aps < 4 && "text-destructive",
										)}
									>
										{aps}/7
									</p>
									<p className="text-muted-foreground text-xs">
										{getGrade(accuracy)}
									</p>
								</div>
							);
						})()}
					</div>
				</CardContent>
			</Card>

			<div className="flex flex-col gap-2">
				{flatParts.map((item) => {
					const result = resultMap.get(item.part.id);
					if (!result) return null;
					const isExpanded = expandedId === item.part.id;
					return (
						<Card
							key={item.part.id}
							className={cn(
								"overflow-hidden transition-shadow",
								result.correct ? "border-success/20" : "border-destructive/20",
							)}
						>
							<button
								type="button"
								onClick={() => setExpandedId(isExpanded ? null : item.part.id)}
								className="flex w-full items-center justify-between p-4 text-left"
							>
								<div className="flex items-center gap-3">
									<span
										className={cn(
											"flex size-7 items-center justify-center rounded-full font-bold text-xs",
											result.correct
												? "bg-success/20 text-success"
												: "bg-destructive/20 text-destructive",
										)}
									>
										{result.correct ? "✓" : "✗"}
									</span>
									<div>
										<p className="font-medium text-sm">
											{item.questionId}.{item.part.id.split("-").pop()}
										</p>
										<p className="line-clamp-1 text-muted-foreground text-xs">
											{item.part.text ?? t("exam.questionText")}
										</p>
									</div>
								</div>
							</button>
							{isExpanded && (
								<div className="flex flex-col gap-3 border-border border-t px-4 pt-3 pb-4">
									{item.part.text && (
										<div className="text-sm">
											<MarkdownRenderer content={item.part.text} />
										</div>
									)}
									<div className="grid grid-cols-2 gap-3 text-sm">
										<div>
											<p className="mb-1 text-muted-foreground text-xs">
												{t("exam.yourAnswer")}
											</p>
											<p className="rounded-lg bg-muted p-2 font-mono text-xs">
												{getAnswerText(item.part, answers[item.part.id]) ||
													t("exam.noAnswer")}
											</p>
										</div>
										{!result.correct && (
											<div>
												<p className="mb-1 text-muted-foreground text-xs">
													{t("exam.correctAnswer")}
												</p>
												<p className="rounded-lg bg-success/10 p-2 font-mono text-success text-xs">
													{getCorrectAnswerText(item.part) || t("exam.notAvailable")}
												</p>
											</div>
										)}
									</div>
									{item.part.marks && (
										<p className="text-muted-foreground text-xs">
											{t("exam.marks", { score: result.score, marks: item.part.marks })}
										</p>
									)}
								</div>
							)}
						</Card>
					);
				})}
			</div>

			<div className="flex flex-col gap-3">
				{failedCount > 0 && onReview && (
					<Button variant="secondary" onClick={onReview}>
						<HugeiconsIcon icon={RefreshIcon} data-icon="inline-start" />
						{t("exam.reviewMistakes")}
					</Button>
				)}
				<ShareResultButton
					cardParams={{
						score: correctCount,
						total: totalCount,
						percentage: accuracy,
						title: t("exam.examHeading", { subject: _metadata.subject }),
						subtitle: `${getAPSForSubject(accuracy)}/7 APS · ${getGrade(accuracy)}`,
						type: "exam",
					}}
					text={t("exam.shareText", { percentage: accuracy, subject: _metadata.subject })}
				/>
				<Button onClick={onDashboard}>
					<HugeiconsIcon icon={Home01Icon} data-icon="inline-start" />
					{t("exam.dashboard")}
				</Button>
			</div>
		</m.div>
	);
}

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
									? t("exam.questionsAnswered", { count: Object.keys(JSON.parse(resumeData.answers)).length })
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
		"timed" | "practice" | null
	>(null);
	const sessionMode = sessionModeOverride ?? mode;
	const [showPalette, setShowPalette] = useState(false);
	const [paused, setPaused] = useState(false);
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

	useExamSessionAutoSave(id);

	const flatParts = useMemo(() => {
		if (!paper) return [];
		return getFlatParts();
	}, [paper, getFlatParts]);

	useEffect(() => {
		if (!paperLoading && paperData) {
			const durationMinutes = parseDuration(paperData.exam.metadata.duration);
			initSession(paperData.exam, paperData.metadata.id, durationMinutes);
			setPhase("mode-select");
		}
	}, [paperLoading, paperData, initSession]);

	useEffect(() => {
		if (timeRemaining <= 0 && phase === "active" && sessionMode === "timed") {
			completeSession();
			setPhase("submitting");
		}
		if (phase === "active" && sessionMode === "timed" && !paused) {
			timerRef.current = setInterval(() => {
				tick();
			}, 1000);
		}
		return () => {
			if (timerRef.current) clearInterval(timerRef.current);
		};
	}, [phase, sessionMode, paused, tick, timeRemaining, completeSession]);

	const startSession = useCallback(() => {
		const first = flatParts[0];
		if (first) setCurrentPart(first.part.id);
		setPhase("active");
	}, [flatParts, setCurrentPart]);

	const currentPartIndex = useMemo(
		() => flatParts.findIndex((p) => p.part.id === currentPartId),
		[flatParts, currentPartId],
	);

	const currentPart = useMemo(
		() => (currentPartIndex >= 0 ? flatParts[currentPartIndex] : null),
		[flatParts, currentPartIndex],
	);

	const goToNext = useCallback(() => {
		if (currentPartIndex < flatParts.length - 1) {
			setCurrentPart(flatParts[currentPartIndex + 1].part.id);
		}
	}, [currentPartIndex, flatParts, setCurrentPart]);

	const goToPrevious = useCallback(() => {
		if (currentPartIndex > 0) {
			setCurrentPart(flatParts[currentPartIndex - 1].part.id);
		}
	}, [currentPartIndex, flatParts, setCurrentPart]);

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
			const answer = answers[item.part.id];
			let correct = false;
			if (item.part.type === "multiple-choice" && item.part.options) {
				const selected = Array.isArray(answer?.value)
					? answer?.value[0]
					: answer?.value;
				correct = item.part.options.some(
					(o) => o.id === selected && o.isCorrect,
				);
			}
			return { partId: item.part.id, correct, score: correct ? 1 : 0 };
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
					questionId: item.part.id,
					questionText: partText,
					subject,
					topic,
					correctAnswer: getCorrectAnswerText(item.part),
					userAnswer: getAnswerText(item.part, answers[item.part.id]),
					explanation: "",
				});
				flashcardPromises.push(
					createFlashcard(
						partText,
						getCorrectAnswerText(item.part) || "Review this topic",
						subject,
					),
				);
			}
		}
		await Promise.all(flashcardPromises);

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
						<p className="font-medium text-destructive">
							{t("exam.notFound")}
						</p>
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
			<m.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				className="flex min-h-screen items-center justify-center bg-background p-4"
			>
				<Card className="w-full max-w-md">
					<CardHeader>
						<CardTitle className="font-extrabold text-xl tracking-tight">
							{t("exam.paperInfo", { subject: paperData?.exam.metadata.subject ?? "", paperCode: paperData?.exam.metadata.paperCode ?? "" })}
						</CardTitle>
						<p className="text-muted-foreground text-sm">
							{t("exam.paperMeta", { year: paperData?.exam.metadata.year ?? "", period: paperData?.exam.metadata.examPeriod ?? "", marks: paperData?.exam.metadata.totalMarks ?? 0, duration: paperData?.exam.metadata.duration ?? "" })}
						</p>
					</CardHeader>
					<CardContent className="flex flex-col gap-3">
						<Button size="lg" onClick={startSession}>
							<HugeiconsIcon icon={PlayFreeIcons} data-icon="inline-start" />
							{t("exam.startPractice")}
						</Button>
						<Button
							variant="outline"
							size="lg"
							onClick={() => {
								setSessionModeOverride("timed");
								startSession();
							}}
						>
							<HugeiconsIcon icon={Clock01Icon} data-icon="inline-start" />
							{t("exam.startTimed")}
						</Button>
					</CardContent>
				</Card>
			</m.div>
		);
	}

	if (phase === "results") {
		const partResults = flatParts.map((item) => {
			const answer = answers[item.part.id];
			let correct = false;
			if (item.part.type === "multiple-choice" && item.part.options) {
				const selected = Array.isArray(answer?.value)
					? answer?.value[0]
					: answer?.value;
				correct = item.part.options.some(
					(o) => o.id === selected && o.isCorrect,
				);
			}
			return { partId: item.part.id, correct, score: correct ? 1 : 0 };
		});
		return (
			<ExamResults
				results={{ partResults }}
				flatParts={flatParts}
				answers={answers}
				metadata={{
					subject: paperData?.exam.metadata.subject ?? "",
					totalMarks: paperData?.exam.metadata.totalMarks ?? 0,
					duration: paperData?.exam.metadata.duration ?? "",
				}}
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
			<header className="sticky top-0 z-sticky border-border border-b bg-background/80 backdrop-blur-xl">
				<div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
					<div className="flex items-center gap-3">
						<button
							type="button"
							onClick={() => setPhase("submitting")}
							className="-ml-2 rounded-xl p-2 transition-colors hover:bg-muted"
						>
							<HugeiconsIcon icon={ArrowLeft01Icon} className="size-5" />
						</button>
						<div>
							<p className="font-semibold text-sm">
								{paperData?.exam.metadata.paperCode}
							</p>
							<p className="text-muted-foreground text-xs">
								{sessionMode === "timed" ? t("exam.timed") : t("exam.practice")} ·{" "}
								{answeredCount}/{totalPartsCount}
							</p>
						</div>
					</div>

					<div className="flex items-center gap-3">
						{sessionMode === "timed" && (
							<div className="flex items-center gap-2">
								<HugeiconsIcon icon={Clock01Icon} className="size-4" />
								<span
									className={cn(
										"font-mono text-sm tabular-nums",
										timeRemaining < 300 && "text-destructive",
									)}
								>
									{formatTime(timeRemaining)}
								</span>
							</div>
						)}

						{sessionMode === "practice" && (
							<button
								type="button"
								onClick={() => setPaused((p) => !p)}
								className="rounded-xl p-2 transition-colors hover:bg-muted"
							>
								{paused ? (
									<HugeiconsIcon icon={PlayFreeIcons} className="size-5" />
								) : (
									<HugeiconsIcon icon={Pause} className="size-5" />
								)}
							</button>
						)}

						<button
							type="button"
							onClick={() => setShowPalette((p) => !p)}
							className="relative rounded-xl p-2 transition-colors hover:bg-muted"
						>
							<span className="font-mono text-sm tabular-nums">
								{currentPartIndex + 1}/{totalPartsCount}
							</span>
						</button>

						<Button size="sm" onClick={handleSubmit}>
							{t("exam.submitExam")}
						</Button>
					</div>
				</div>
			</header>

			<div className="flex flex-1">
				<AnimatePresence initial={false}>
					{showPalette && (
						<m.aside
							initial={{ width: 0, opacity: 0 }}
							animate={{ width: 260, opacity: 1 }}
							exit={{ width: 0, opacity: 0 }}
							className="overflow-hidden border-border border-r bg-muted/20"
						>
							<div className="w-[260px] p-4">
								<p className="mb-3 font-semibold text-muted-foreground text-xs">
									{t("exam.questionNavigator")}
								</p>
								<QuestionNavigator
									totalParts={flatParts}
									currentPartId={currentPartId}
									answers={answers}
									flags={flags}
									onNavigate={(partId) => {
										setCurrentPart(partId);
										setShowPalette(false);
									}}
								/>
							</div>
						</m.aside>
					)}
				</AnimatePresence>

				<main className="mx-auto w-full max-w-3xl flex-1 p-4 md:p-6">
					<AnimatePresence mode="wait" initial={false}>
						{currentPart && (
							<m.div
								key={currentPart.part.id}
								initial={{ opacity: 0, x: 20 }}
								animate={{ opacity: 1, x: 0 }}
								exit={{ opacity: 0, x: -20 }}
								transition={{ duration: 0.2, ease: iOSEase }}
								className="flex flex-col gap-4"
							>
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										{currentPart.part.marks && (
											<Badge variant="outline" className="text-xs">
												{t("exam.marksBadge", { marks: currentPart.part.marks })}
											</Badge>
										)}
									</div>

									<button
										type="button"
										onClick={() => currentPartId && toggleFlag(currentPartId)}
										className={cn(
											"rounded-xl p-2 transition-colors",
											currentPartId && flags.includes(currentPartId)
												? "bg-warning/10 text-warning"
												: "text-muted-foreground hover:bg-muted",
										)}
									>
										<HugeiconsIcon
											icon={Flag01Icon}
											className={cn(
												"size-5 transition-colors",
												currentPartId && flags.includes(currentPartId)
													? "fill-warning text-warning"
													: "text-muted-foreground",
											)}
										/>
									</button>
								</div>

								<div className="text-base leading-relaxed">
									{currentPart.part.text && (
										<MarkdownRenderer content={currentPart.part.text} />
									)}
								</div>

								<div className="pt-2">
									<PartAnswerInput
										part={currentPart.part}
										value={
											currentPartId ? (answers[currentPartId]?.value ?? "") : ""
										}
										onChange={handleAnswer}
										disabled={paused}
									/>
								</div>

								<div className="flex items-center justify-between border-border border-t pt-4">
									<Button
										variant="outline"
										onClick={goToPrevious}
										disabled={currentPartIndex <= 0}
									>
										<HugeiconsIcon
											icon={ArrowLeft01Icon}
											data-icon="inline-start"
										/>
										{t("exam.previous")}
									</Button>

									<span className="text-muted-foreground text-xs">
										{t("exam.indexOfTotal", { index: currentPartIndex + 1, total: totalPartsCount })}
									</span>

									{currentPartIndex < totalPartsCount - 1 ? (
										<Button onClick={goToNext}>
											{t("exam.next")}
											<HugeiconsIcon
												icon={ArrowRight01Icon}
												data-icon="inline-end"
											/>
										</Button>
									) : (
										<Button onClick={handleSubmit}>{t("exam.finishSubmit")}</Button>
									)}
								</div>
							</m.div>
						)}
					</AnimatePresence>
				</main>
			</div>
			<GamificationCelebration />
		</div>
	);
}
