"use client";

import {
	ArrowDown01Icon,
	FlashIcon,
	PlayIcon,
	SquareIcon,
	Timer01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { m, useReducedMotion } from "framer-motion";
import { useCallback, useState } from "react";
import { SubjectsDrawer } from "@/components/dashboard/drawers/subjects-drawer";
import { QuizStartState, QuizSubjectPrompt } from "@/components/quiz";
import { Anim } from "@/components/shared/anim";
import { PerpetualFloat } from "@/components/shared/perpetual-float";
import { Button } from "@/components/ui/button";

import { Tabs, TabsTrigger } from "@/components/ui/tabs";
import { useQuizSession } from "@/hooks/use-quiz-session";
import { cn } from "@/lib/shared";
import { formatTime } from "@/lib/shared/time";
import { iOSEase } from "@/lib/utils/animation";
import { useOptimizedAnimation } from "@/lib/utils/animation-optimization";

interface QuizTabProps {
	className?: string;
	onHeaderChange?: (show: boolean) => void;
}

const MAX_TIME = 90 * 60;
const DEFAULT_QUESTION_COUNT = 10;

interface TabConfig {
	value: string;
	label: string;
}

const tabs: TabConfig[] = [
	{ value: "quiz", label: "Quiz" },
	{ value: "notes", label: "Notes" },
	{ value: "flashcards", label: "Flashcards" },
];

export function QuizTab({ className, onHeaderChange }: QuizTabProps) {
	const [activeTab, setActiveTab] = useState("quiz");
	const shouldReduceMotion = useReducedMotion();
	const { shouldReduceMotion: shouldReduceMotionOpt } = useOptimizedAnimation();
	const finalShouldReduceMotion = shouldReduceMotion || shouldReduceMotionOpt;

	const { state, actions } = useQuizSession({
		questionCount: DEFAULT_QUESTION_COUNT,
		maxTime: MAX_TIME,
		onFinish: useCallback(() => {
			onHeaderChange?.(true);
		}, [onHeaderChange]),
	});

	const {
		isRunning,
		elapsedTime,
		currentQuestion,
		hasSubject,
		selectedSubject,
		points,
	} = state;

	const { handleStartWithSubject, handleStop } = actions;

	const doStart = useCallback(() => {
		if (hasSubject) {
			handleStartWithSubject(selectedSubject);
			onHeaderChange?.(false);
		}
	}, [hasSubject, handleStartWithSubject, selectedSubject, onHeaderChange]);

	if (isRunning && currentQuestion) {
		return (
			<div className="grid grid-cols-12 gap-0 min-h-[calc(100dvh-var(--spacing-safe-pt))]">
				{/* Main quiz — left column */}
				<div className="col-span-12 md:col-span-7 col-start-1 p-4 pb-20">
					<Anim>
						<m.div
							className="relative w-full"
							initial={{ x: "-100%" }}
							animate={{ x: "0%" }}
							exit={{ x: "100%" }}
							transition={{ duration: 0.5, ease: iOSEase }}
						>
							<Tabs
								value={activeTab}
								onValueChange={setActiveTab}
								className="flex flex-wrap w-full"
							>
								{tabs.map((tab) => (
									<TabsTrigger
										key={tab.value}
										value={tab.value}
										className={cn(
											"relative z-10 px-4 h-8 rounded-xl text-xs font-medium transition-colors duration-200 tab-trigger-item",
											activeTab === tab.value
												? "text-foreground"
												: "text-muted-foreground hover:text-foreground",
										)}
									>
										{tab.label}
									</TabsTrigger>
								))}
							</Tabs>
						</m.div>
					</Anim>
				</div>

				{/* Decorative accent — right zone */}
				<div
					className="col-span-12 md:col-span-5 col-start-1 md:col-start-8 relative overflow-hidden bg-system-surface/30"
					aria-hidden="true"
				>
					{!finalShouldReduceMotion && (
						<PerpetualFloat
							className="absolute right-8 top-1/2 -translate-y-1/2"
							duration={10}
							offsetY={-16}
							aria-hidden="true"
						>
							<div className="size-24 rounded-2xl bg-[--system-accent]/10 blur-xl" />
						</PerpetualFloat>
					)}
					<div className="absolute inset-0 bg-linear-to-br from-[--system-accent]/10 via-transparent to-transparent" />
					<div className="absolute inset-0 flex items-center justify-center p-8">
						<div className="w-full h-full max-w-xs aspect-square rounded-3xl bg-system-accent/10 blur-2xl animate-float-slow" />
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="w-full h-full flex flex-col">
			<div
				className={cn(
					"flex items-center gap-3 justify-between w-full",
					className,
				)}
			>
				<SubjectsDrawer onSelect={handleStartWithSubject}>
					<Button
						variant="secondary"
						size="sm"
						className="rounded-md pl-3 border-muted bg-muted/50"
						disabled={isRunning}
					>
						<div className="flex items-center gap-3">
							{hasSubject ? selectedSubject : "Subject"}
							<HugeiconsIcon icon={ArrowDown01Icon} />
						</div>
					</Button>
				</SubjectsDrawer>

				<div
					className={cn(
						"flex items-center gap-3 pl-4 py-2 rounded-full bg-muted/30 border border-muted transition-opacity duration-300",
						!hasSubject && "opacity-30 pointer-events-none",
					)}
				>
					<div className="flex items-center gap-2 min-w-16">
						<HugeiconsIcon
							icon={Timer01Icon}
							className="size-4 text-muted-foreground"
						/>
						<span className="text-sm font-medium -mb-0.5 tabular-nums font-mono tracking-tight">
							{formatTime(elapsedTime)}
						</span>
					</div>

					<div className="w-px h-4 bg-muted" />

					<div className="flex items-center gap-2 min-w-14">
						<HugeiconsIcon icon={FlashIcon} className="size-4 text-warning" />
						<span className="text-sm font-semibold tabular-nums font-mono">
							{points}
						</span>
					</div>
				</div>

				{isRunning ? (
					<Button
						size="icon"
						onClick={handleStop}
						className="rounded-full bg-destructive hover:bg-destructive/90"
					>
						<HugeiconsIcon icon={SquareIcon} className="size-4" />
					</Button>
				) : (
					<Button
						size="icon"
						onClick={doStart}
						disabled={!hasSubject}
						className={cn(
							"rounded-full",
							hasSubject
								? "bg-[--system-accent] hover:bg-[--system-accent]/90 animate-fade-in-scale"
								: "bg-muted cursor-not-allowed",
						)}
					>
						<HugeiconsIcon icon={PlayIcon} className="size-4 ml-0.5" />
					</Button>
				)}
			</div>

			{hasSubject ? (
				<QuizStartState onSelect={doStart} />
			) : (
				<QuizSubjectPrompt onSelect={() => {}} hasSubject={false} />
			)}
		</div>
	);
}
