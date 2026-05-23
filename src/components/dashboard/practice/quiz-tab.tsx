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
			<div className="grid min-h-[calc(100dvh-var(--spacing-safe-pt))] grid-cols-12 gap-0">
				{/* Main quiz — left column */}
				<div className="col-span-12 col-start-1 p-4 pb-20 md:col-span-7">
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
								className="flex w-full flex-wrap"
							>
								{tabs.map((tab) => (
									<TabsTrigger
										key={tab.value}
										value={tab.value}
										className={cn(
											"tab-trigger-item relative z-elevated h-8 rounded-xl px-4 font-medium text-xs transition-colors duration-200",
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
					className="relative col-span-12 col-start-1 overflow-hidden bg-system-surface/30 md:col-span-5 md:col-start-8"
					aria-hidden="true"
				>
					{!finalShouldReduceMotion && (
						<PerpetualFloat
							className="absolute top-1/2 right-8 -translate-y-1/2"
							duration={10}
							offsetY={-16}
							aria-hidden="true"
						>
							<div className="size-24 rounded-2xl bg-[--system-accent]/10 blur-xl" />
						</PerpetualFloat>
					)}
					<div className="absolute inset-0 bg-linear-to-br from-[--system-accent]/10 via-transparent to-transparent" />
					<div className="absolute inset-0 flex items-center justify-center p-8">
						<div className="aspect-square h-full w-full max-w-xs animate-float-slow rounded-3xl bg-system-accent/10 blur-2xl" />
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="flex h-full w-full flex-col">
			<div
				className={cn(
					"flex w-full items-center justify-between gap-3",
					className,
				)}
			>
				<SubjectsDrawer onSelect={handleStartWithSubject}>
					<Button
						variant="secondary"
						size="sm"
						className="rounded-md border-muted bg-muted/50 pl-3"
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
						"flex items-center gap-3 rounded-full border border-muted bg-muted/30 py-2 pl-4 transition-opacity duration-300",
						!hasSubject && "pointer-events-none opacity-30",
					)}
				>
					<div className="flex min-w-16 items-center gap-2">
						<HugeiconsIcon
							icon={Timer01Icon}
							className="size-4 text-muted-foreground"
						/>
						<span className="-mb-0.5 font-medium font-mono text-sm tabular-nums tracking-tight">
							{formatTime(elapsedTime)}
						</span>
					</div>

					<div className="h-4 w-px bg-muted" />

					<div className="flex min-w-14 items-center gap-2">
						<HugeiconsIcon icon={FlashIcon} className="size-4 text-warning" />
						<span className="font-mono font-semibold text-sm tabular-nums">
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
								? "animate-fade-in-scale bg-[--system-accent] hover:bg-[--system-accent]/90"
								: "cursor-not-allowed bg-muted",
						)}
					>
						<HugeiconsIcon icon={PlayIcon} className="ml-0.5 size-4" />
					</Button>
				)}
			</div>

			{hasSubject ? (
				<QuizStartState onSelect={doStart} />
			) : (
				<QuizSubjectPrompt
					onSelect={() => console.warn("No subject selected")}
					hasSubject={false}
				/>
			)}
		</div>
	);
}
