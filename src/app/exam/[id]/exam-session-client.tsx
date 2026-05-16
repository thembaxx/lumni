"use client";

import {
	ArrowLeft,
	ArrowRight,
	Clock,
	Flag,
	House,
	Pause,
	Play,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Confetti } from "@/components/celebration";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useExamPaper } from "@/hooks/use-exam-paper";
import { useGamification } from "@/hooks/use-gamification";
import { competencyService } from "@/lib/competency-engine/competency-service";
import { cn } from "@/lib/shared";
import { formatTime } from "@/lib/shared/time";
import { iOSEase } from "@/lib/utils/animation";
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
	if (hourMatch) total += parseInt(hourMatch[1]) * 60;
	if (minMatch) total += parseInt(minMatch[1]);
	return total || 180;
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
	if (part.type === "multiple-choice" && part.options) {
		const selected = Array.isArray(value) ? value[0] : value;
		return (
			<div className="flex flex-col gap-2">
				{part.options.map((opt) => (
					<button
						key={opt.id}
						disabled={disabled}
						onClick={() => onChange(opt.id)}
						className={cn(
							"w-full text-left p-3 rounded-xl border-2 transition-[border-color,background-color]",
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

	if (part.type === "short-answer") {
		return (
			<input
				type="text"
				value={(Array.isArray(value) ? value[0] : value) ?? ""}
				onChange={(e) => onChange(e.target.value)}
				disabled={disabled}
				className="w-full p-3 rounded-xl border-2 border-border bg-background focus:border-[--system-accent] outline-none"
				placeholder="Type your answer..."
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
				className="w-full p-3 rounded-xl border-2 border-border bg-background focus:border-[--system-accent] outline-none resize-y"
				placeholder="Write your answer..."
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
				className="w-full p-3 rounded-xl border-2 border-border bg-background focus:border-[--system-accent] outline-none font-mono"
				placeholder="Enter your answer..."
			/>
		);
	}

	return (
		<p className="text-sm text-muted-foreground">
			Answer type not yet supported in exam mode.
		</p>
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
		<div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
			{Object.entries(groups).map(([key, items]) => {
				return (
					<div key={key} className="flex flex-wrap gap-1.5">
						{items.map((item) => {
							const isCurrent = item.part.id === currentPartId;
							const isAnswered = !!answers[item.part.id];
							const isFlagged = flags.includes(item.part.id);
							const label = `${key.split("-").pop()}${item.part.id.split("-").pop()}`;
							return (
								<button
									key={item.part.id}
									onClick={() => onNavigate(item.part.id)}
									className={cn(
										"size-8 rounded-lg text-xs font-medium transition-colors",
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
	metadata,
	onDashboard,
}: {
	results: {
		partResults: { partId: string; correct: boolean; score: number }[];
	};
	metadata: { subject: string; totalMarks: number; duration: string };
	onDashboard: () => void;
}) {
	const correctCount = results.partResults.filter((r) => r.correct).length;
	const totalCount = results.partResults.length;
	const accuracy =
		totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			className="min-h-screen bg-background p-4 flex flex-col gap-6"
		>
			<Confetti trigger={accuracy >= 70} count={60} duration={2500} />
			<Card>
				<CardHeader>
					<CardTitle className="text-xl font-extrabold">
						{accuracy >= 80
							? "Great job!"
							: accuracy >= 50
								? "Good effort!"
								: "Keep practicing!"}
					</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-col gap-4">
					<div className="grid grid-cols-3 gap-3">
						<div className="p-3 rounded-lg bg-muted text-center">
							<p className="text-2xl font-extrabold tabular-nums">
								{correctCount}
							</p>
							<p className="text-xs text-muted-foreground">Correct</p>
						</div>
						<div className="p-3 rounded-lg bg-muted text-center">
							<p className="text-2xl font-extrabold tabular-nums">
								{totalCount}
							</p>
							<p className="text-xs text-muted-foreground">Questions</p>
						</div>
						<div className="p-3 rounded-lg bg-muted text-center">
							<p className="text-2xl font-extrabold tabular-nums">
								{accuracy}%
							</p>
							<p className="text-xs text-muted-foreground">Accuracy</p>
						</div>
					</div>
				</CardContent>
			</Card>
			<Button onClick={onDashboard}>
				<House data-icon="inline-start" />
				Dashboard
			</Button>
		</motion.div>
	);
}

export function ExamSessionClient({ id, mode }: ExamSessionClientProps) {
	const { data: paperData, isLoading: paperLoading } = useExamPaper(id);
	const [phase, setPhase] = useState<SessionPhase>("loading");
	const [sessionMode, setSessionMode] = useState<"timed" | "practice">(mode);
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
		if (phase === "active" && sessionMode === "timed" && !paused) {
			timerRef.current = setInterval(() => {
				tick();
			}, 1000);
		}
		return () => {
			if (timerRef.current) clearInterval(timerRef.current);
		};
	}, [phase, sessionMode, paused, tick]);

	useEffect(() => {
		if (timeRemaining <= 0 && phase === "active" && sessionMode === "timed") {
			completeSession();
			setPhase("submitting");
		}
	}, [timeRemaining, phase, sessionMode, completeSession]);

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
				correct = item.part.options.some((o) => o.id === selected && o.isCorrect);
			}
			return { partId: item.part.id, correct, score: correct ? 1 : 0 };
		});

		const correctCount = partResults.filter((r) => r.correct).length;
		const totalCount = partResults.length;
		const accuracy =
			totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

		updateStreak();
		addXp(totalCount, accuracy >= 50, currentStreak);
		checkAndUnlockAchievements(
			totalQuestionsAnswered + totalCount,
			accuracy,
			currentStreak,
			levelInfo.level,
			accuracy === 100,
		);

		for (const result of partResults) {
			competencyService.update(
				paperData?.metadata.subject ?? "unknown",
				"exam-practice",
				"apply",
				result.score,
				1,
			);
		}

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
	]);

	const handleDashboard = useCallback(() => {
		resetSession();
		window.history.back();
	}, [resetSession]);

	if (paperLoading) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<p className="text-muted-foreground animate-pulse">
					Loading exam paper...
				</p>
			</div>
		);
	}

	if (!paperData && !paperLoading) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center p-4">
				<Card>
					<CardContent className="p-8 text-center">
						<p className="text-destructive font-medium">
							Exam paper not found.
						</p>
						<Button className="mt-4" onClick={handleDashboard}>
							Go Back
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (phase === "mode-select") {
		return (
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				className="min-h-screen bg-background flex items-center justify-center p-4"
			>
				<Card className="max-w-md w-full">
					<CardHeader>
						<CardTitle className="text-xl font-extrabold tracking-tight">
							{paperData?.exam.metadata.subject} -{" "}
							{paperData?.exam.metadata.paperCode}
						</CardTitle>
						<p className="text-sm text-muted-foreground">
							{paperData?.exam.metadata.year}{" "}
							{paperData?.exam.metadata.examPeriod} |{" "}
							{paperData?.exam.metadata.totalMarks} marks |{" "}
							{paperData?.exam.metadata.duration}
						</p>
					</CardHeader>
					<CardContent className="flex flex-col gap-3">
						<Button size="lg" onClick={startSession}>
							<Play data-icon="inline-start" />
							Start Practice Mode
						</Button>
						<Button
							variant="outline"
							size="lg"
							onClick={() => {
								setSessionMode("timed");
								startSession();
							}}
						>
							<Clock data-icon="inline-start" />
							Start Timed Exam
						</Button>
					</CardContent>
				</Card>
			</motion.div>
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
				correct = item.part.options.some((o) => o.id === selected && o.isCorrect);
			}
			return { partId: item.part.id, correct, score: correct ? 1 : 0 };
		});
		return (
			<ExamResults
				results={{ partResults }}
				metadata={{
					subject: paperData?.exam.metadata.subject ?? "",
					totalMarks: paperData?.exam.metadata.totalMarks ?? 0,
					duration: paperData?.exam.metadata.duration ?? "",
				}}
				onDashboard={handleDashboard}
			/>
		);
	}

	const answeredCount = getAnsweredCount();
	const totalPartsCount = getTotalPartsCount();

	return (
		<div className="min-h-screen bg-background flex flex-col">
			<header className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border">
				<div className="flex items-center justify-between px-4 py-3 max-w-5xl mx-auto w-full">
					<div className="flex items-center gap-3">
						<button
							onClick={() => setPhase("submitting")}
							className="p-2 -ml-2 hover:bg-muted rounded-xl transition-colors"
						>
							<ArrowLeft className="size-5" />
						</button>
						<div>
							<p className="text-sm font-semibold">
								{paperData?.exam.metadata.paperCode}
							</p>
							<p className="text-xs text-muted-foreground">
								{sessionMode === "timed" ? "Timed" : "Practice"} ·{" "}
								{answeredCount}/{totalPartsCount}
							</p>
						</div>
					</div>

					<div className="flex items-center gap-3">
						{sessionMode === "timed" && (
							<div className="flex items-center gap-2">
								<Clock className="size-4" />
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
								onClick={() => setPaused((p) => !p)}
								className="p-2 hover:bg-muted rounded-xl transition-colors"
							>
								{paused ? (
									<Play className="size-5" />
								) : (
									<Pause className="size-5" />
								)}
							</button>
						)}

						<button
							onClick={() => setShowPalette((p) => !p)}
							className="p-2 hover:bg-muted rounded-xl transition-colors relative"
						>
							<span className="text-sm font-mono tabular-nums">
								{currentPartIndex + 1}/{totalPartsCount}
							</span>
						</button>

						<Button size="sm" onClick={handleSubmit}>
							Submit
						</Button>
					</div>
				</div>
			</header>

			<div className="flex-1 flex">
				<AnimatePresence initial={false}>
					{showPalette && (
						<motion.aside
							initial={{ width: 0, opacity: 0 }}
							animate={{ width: 260, opacity: 1 }}
							exit={{ width: 0, opacity: 0 }}
							className="border-r border-border overflow-hidden bg-muted/20"
						>
							<div className="p-4 w-[260px]">
								<p className="text-xs font-semibold text-muted-foreground mb-3">
									Question Navigator
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
						</motion.aside>
					)}
				</AnimatePresence>

				<main className="flex-1 p-4 md:p-6 max-w-3xl mx-auto w-full">
					<AnimatePresence mode="wait" initial={false}>
						{currentPart && (
							<motion.div
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
												{currentPart.part.marks} marks
											</Badge>
										)}
									</div>

									<button
										onClick={() => currentPartId && toggleFlag(currentPartId)}
										className={cn(
											"p-2 rounded-xl transition-colors",
											currentPartId && flags.includes(currentPartId)
												? "text-warning bg-warning/10"
												: "text-muted-foreground hover:bg-muted",
										)}
									>
										<Flag
											className={cn(
												"size-5 transition-colors",
												currentPartId && flags.includes(currentPartId)
													? "text-warning fill-warning"
													: "text-muted-foreground",
											)}
											weight={
												currentPartId && flags.includes(currentPartId)
													? "fill"
													: "regular"
											}
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

								<div className="flex items-center justify-between pt-4 border-t border-border">
									<Button
										variant="outline"
										onClick={goToPrevious}
										disabled={currentPartIndex <= 0}
									>
										<ArrowLeft data-icon="inline-start" />
										Previous
									</Button>

									<span className="text-xs text-muted-foreground">
										{currentPartIndex + 1} of {totalPartsCount}
									</span>

									{currentPartIndex < totalPartsCount - 1 ? (
										<Button onClick={goToNext}>
											Next
											<ArrowRight data-icon="inline-end" />
										</Button>
									) : (
										<Button onClick={handleSubmit}>Submit</Button>
									)}
								</div>
							</motion.div>
						)}
					</AnimatePresence>
				</main>
			</div>
		</div>
	);
}
