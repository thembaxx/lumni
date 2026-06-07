"use client";

import {
	Cancel01Icon,
	CheckmarkCircle01Icon,
	FireIcon,
	SparklesIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { m } from "framer-motion";
import { Button } from "@/components/ui/button";
import { iOSDecelerate } from "@/lib/utils/animation";
import {
	XP_PER_CORRECT,
	XP_PER_QUESTION,
	XP_STREAK_BONUS,
} from "@/types/gamification";

interface BoltCelebrationProps {
	correct: boolean;
	subjectLabel: string;
	streak: number;
	onContinue: () => void;
	onPracticeMore?: () => void;
}

const variants = {
	hidden: { opacity: 0, y: 20, scale: 0.95 },
	visible: (i: number) => ({
		opacity: 1,
		y: 0,
		scale: 1,
		transition: { duration: 0.45, ease: iOSDecelerate, delay: i * 0.12 },
	}),
};

export function BoltCelebration({
	correct,
	subjectLabel,
	streak,
	onContinue,
	onPracticeMore,
}: BoltCelebrationProps) {
	const baseXp = XP_PER_QUESTION + (correct ? XP_PER_CORRECT : 0);
	const showStreakBonus = streak > 1;
	const totalXp = baseXp + (showStreakBonus ? XP_STREAK_BONUS : 0);

	return (
		<div className="flex flex-1 flex-col items-center justify-center gap-8 py-8">
			<div className="flex flex-col items-center gap-5 text-center">
				<m.div
					custom={0}
					variants={variants}
					initial="hidden"
					animate="visible"
					className="relative"
				>
					<div
						className={
							correct
								? "relative flex size-20 items-center justify-center rounded-3xl bg-success/15 ring-1 ring-success/25"
								: "relative flex size-20 items-center justify-center rounded-3xl bg-destructive/10 ring-1 ring-destructive/20"
						}
					>
						<div
							className={
								correct
									? "absolute inset-0 rounded-3xl bg-success/20 blur-xl"
									: "absolute inset-0 rounded-3xl bg-destructive/20 blur-xl"
							}
						/>
						<m.div
							initial={{ scale: 0.6, rotate: correct ? -20 : 20 }}
							animate={{ scale: 1, rotate: 0 }}
							transition={{
								type: "spring",
								stiffness: 250,
								damping: 14,
								delay: 0.15,
							}}
						>
							<HugeiconsIcon
								icon={correct ? CheckmarkCircle01Icon : Cancel01Icon}
								className={
									correct
										? "relative size-10 text-success"
										: "relative size-10 text-destructive"
								}
								strokeWidth={2.25}
							/>
						</m.div>
					</div>
				</m.div>

				<m.div
					custom={1}
					variants={variants}
					initial="hidden"
					animate="visible"
					className="flex flex-col gap-1.5"
				>
					<h2 className="ios-title-2 text-balance font-extrabold text-foreground tracking-tight">
						{correct ? "Correct!" : "Not quite"}
					</h2>
					<p className="text-balance text-muted-foreground text-sm">
						{subjectLabel}
					</p>
				</m.div>

				<m.div
					custom={2}
					variants={variants}
					initial="hidden"
					animate="visible"
					className="flex items-center gap-3"
				>
					<div className="flex items-center gap-1.5 rounded-full bg-system-fill px-3.5 py-1.5">
						<HugeiconsIcon
							icon={SparklesIcon}
							className="size-4 text-warning"
							strokeWidth={2}
						/>
						<span className="font-semibold text-sm tabular-nums">
							+{totalXp} XP
						</span>
					</div>
					{showStreakBonus && (
						<div className="flex items-center gap-1.5 rounded-full bg-warning/10 px-3.5 py-1.5">
							<HugeiconsIcon
								icon={FireIcon}
								className="size-4 text-warning"
								strokeWidth={2}
							/>
							<span className="font-semibold text-sm tabular-nums">
								{streak}-day streak
							</span>
						</div>
					)}
				</m.div>
			</div>

			<m.div
				custom={3}
				variants={variants}
				initial="hidden"
				animate="visible"
				className="flex flex-col items-center gap-2.5"
			>
				<Button
					onClick={onContinue}
					size="lg"
					className="min-h-12 gap-2 px-8 text-base"
				>
					Continue to Dashboard
				</Button>
				{onPracticeMore && (
					<Button
						variant="link"
						size="sm"
						onClick={onPracticeMore}
						className="h-auto p-0 text-muted-foreground text-sm"
					>
						Practice more {subjectLabel}
					</Button>
				)}
			</m.div>
		</div>
	);
}
