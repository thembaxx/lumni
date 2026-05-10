"use client";

import { BulbIcon, CheckmarkCircle01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SubjectsDrawer } from "./drawers/subjects-drawer";

interface TodayFocusProps {
	subjectName?: string;
	topicName?: string;
	reason?: string;
	priority?: "weakest" | "due" | "streak" | "balanced";
}

const recommendations = {
	weakest: {
		subject: "Physical Sciences",
		topic: "Chemical Bonding & Molecular Structure",
		reason: "Your lowest-scoring area this week. Time to close the gap.",
		action: "Practice now",
	},
	due: {
		subject: "Mathematics",
		topic: "Calculus: Differential Equations",
		reason:
			"You haven't covered this in 5 days. Spaced repetition says it's due.",
		action: "Start review",
	},
	streak: {
		subject: "English Home Language",
		topic: "Essay Writing: Argumentative Structure",
		reason: "You've built a streak here. Double down to maximize it.",
		action: "Continue",
	},
	balanced: {
		subject: "Life Sciences",
		topic: "Cell Division: Mitosis & Meiosis",
		reason: "Keep all your subjects warm. Balance prevents burnout.",
		action: "Study",
	},
};

const priorityLabels = {
	weakest: { tag: "Needs work", tagColor: "text-destructive" },
	due: { tag: "Due for review", tagColor: "text-warning" },
	streak: { tag: "Keep it hot", tagColor: "text-success" },
	balanced: { tag: "Balance mode", tagColor: "text-info" },
};

const easeOutQuint = [0.22, 1, 0.36, 1] as const;

const staggerChildren = {
	hidden: { opacity: 0, y: 10 },
	visible: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.35, ease: easeOutQuint },
	},
};

export function TodayFocusCard({
	subjectName,
	topicName,
	reason,
	priority = "balanced",
}: TodayFocusProps) {
	const router = useRouter();
	const [selectedSubject, setSelectedSubject] = useState(subjectName ?? null);
	const [showSuccess, setShowSuccess] = useState(false);
	const shouldReduceMotion = useReducedMotion();

	const rec = recommendations[priority];
	const subject = selectedSubject ?? rec.subject;
	const topic = topicName ?? rec.topic;
	const whyReason = reason ?? rec.reason;
	const label = priorityLabels[priority];

	function handleStart() {
		setShowSuccess(true);
		setTimeout(() => {
			router.push(
				`/quiz?subject=${encodeURIComponent(subject)}&topic=${encodeURIComponent(topic)}`,
			);
		}, 600);
	}

	const cardVariants = {
		hidden: { opacity: 0, y: 12 },
		visible: {
			opacity: 1,
			y: 0,
			transition: {
				duration: shouldReduceMotion ? 0 : 0.4,
				ease: easeOutQuint,
			},
		},
	};

	return (
		<motion.div
			variants={cardVariants}
			initial="hidden"
			animate="visible"
			whileHover={
				shouldReduceMotion
					? undefined
					: { y: -2, transition: { duration: 0.2, ease: easeOutQuint } }
			}
		>
			<Card className="relative overflow-hidden border-border/40 bg-secondary/40 dark:bg-secondary/10">
				<div className="absolute inset-0 bg-secondary/50 dark:bg-secondary/30 pointer-events-none" />

				<motion.div className="relative p-4 sm:p-5 space-y-3">
					<motion.div
						variants={staggerChildren}
						className="flex items-start justify-between"
					>
						<div className="flex items-center gap-2">
							<div className="flex items-center justify-center shrink-0 size-7 rounded-full bg-[oklch(62%_0.19_55/15%)] dark:bg-[oklch(72%_0.16_45/20%)]">
								<HugeiconsIcon
									icon={CheckmarkCircle01Icon}
									className="size-3.5"
								/>
							</div>
							<div>
								<span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
									Today&apos;s Focus
								</span>
								<span className={`text-xs font-medium ${label.tagColor}`}>
									<motion.span
										animate={
											shouldReduceMotion ||
											(priority !== "streak" && priority !== "weakest")
												? {}
												: { scale: [1, 1.06, 1] }
										}
										transition={{
											duration: 1.8,
											repeat: Infinity,
											ease: easeOutQuint,
										}}
									>
										{label.tag}
									</motion.span>
								</span>
							</div>
						</div>
					</motion.div>

					<motion.div variants={staggerChildren} className="space-y-1">
						<div className="flex items-center gap-2">
							<p className="text-xs text-primary font-medium">{subject}</p>
							<SubjectsDrawer onSelect={(name) => setSelectedSubject(name)}>
								<button
									type="button"
									className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors underline-offset-2 hover:underline min-h-[40px] min-w-[40px] flex items-center"
								>
									change
								</button>
							</SubjectsDrawer>
						</div>
						<h3 className="text-base sm:text-lg font-bold text-foreground leading-snug">
							{topic}
						</h3>
					</motion.div>

					<motion.p
						variants={staggerChildren}
						className="text-xs text-muted-foreground leading-relaxed"
					>
						{whyReason}
					</motion.p>

					<motion.div variants={staggerChildren}>
						<div className="relative">
							<Button
								size="sm"
								className="w-full font-semibold text-sm h-9 active:scale-[0.96] transition-transform duration-150"
								onClick={handleStart}
								disabled={showSuccess}
							>
								<AnimatePresence mode="wait">
									{showSuccess ? (
										<motion.span
											key="success"
											initial={{ scale: 0.5, opacity: 0 }}
											animate={{ scale: 1, opacity: 1 }}
											exit={{ scale: 0.5, opacity: 0 }}
											transition={{
												duration: shouldReduceMotion ? 0 : 0.25,
												ease: easeOutQuint,
											}}
											className="flex items-center gap-1.5"
										>
											<HugeiconsIcon
												icon={CheckmarkCircle01Icon}
												className="size-3.5"
											/>
											Starting quiz...
										</motion.span>
									) : (
										<motion.span
											key="action"
											initial={{ scale: 0.5, opacity: 0 }}
											animate={{ scale: 1, opacity: 1 }}
											exit={{ scale: 0.5, opacity: 0 }}
											transition={{
												duration: shouldReduceMotion ? 0 : 0.2,
												ease: easeOutQuint,
											}}
										>
											{rec.action}
										</motion.span>
									)}
								</AnimatePresence>
							</Button>
						</div>
					</motion.div>
				</motion.div>
			</Card>
		</motion.div>
	);
}
