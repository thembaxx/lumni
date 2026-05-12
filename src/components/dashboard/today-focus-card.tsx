"use client";

import { CheckmarkCircle01Icon } from "@hugeicons/core-free-icons";
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

const priorityConfig = {
	weakest: {
		tag: "Needs work",
		accent: "bg-[oklch(var(--destructive))]",
		iconColor: "text-[oklch(var(--destructive))]",
	},
	due: {
		tag: "Due for review",
		accent: "bg-[oklch(var(--warning))]",
		iconColor: "text-[oklch(var(--warning))]",
	},
	streak: {
		tag: "Keep it hot",
		accent: "bg-[oklch(var(--success))]",
		iconColor: "text-[oklch(var(--success))]",
	},
	balanced: {
		tag: "Balance mode",
		accent: "bg-[oklch(var(--info))]",
		iconColor: "text-[oklch(var(--info))]",
	},
};

const easeOutQuint = [0.22, 1, 0.36, 1] as const;

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
	const config = priorityConfig[priority];

	function handleStart() {
		setShowSuccess(true);
		setTimeout(() => {
			router.push(
				`/quiz?subject=${encodeURIComponent(subject)}&topic=${encodeURIComponent(topic)}`,
			);
		}, 600);
	}

	return (
		<motion.div
			initial={{ opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{
				duration: shouldReduceMotion ? 0 : 0.35,
				ease: easeOutQuint,
			}}
		>
			<Card className="relative overflow-hidden border-0">
				<div
					className={`absolute top-0 left-0 right-0 h-0.5 ${config.accent}`}
				/>

				<div className="p-5 space-y-4">
					<div className="flex items-center gap-3">
						<div
							className={`flex items-center justify-center size-9 rounded-xl ${config.accent} bg-opacity-15`}
						>
							<HugeiconsIcon
								icon={CheckmarkCircle01Icon}
								className={`size-5 ${config.iconColor}`}
							/>
						</div>
						<div className="space-y-0.5">
							<span className="text-[13px] font-semibold text-[oklch(var(--foreground))] tracking-tight block">
								Today&apos;s Focus
							</span>
							<span className={`text-[12px] font-medium ${config.iconColor}`}>
								{config.tag}
							</span>
						</div>
					</div>

					<div className="space-y-2">
						<div className="flex items-center gap-2">
							<p className="text-[13px] text-[oklch(var(--primary))] font-medium">
								{subject}
							</p>
							<SubjectsDrawer onSelect={(name) => setSelectedSubject(name)}>
								<Button
									type="button"
									variant="link"
									className="text-[12px] text-[oklch(var(--muted-foreground))] hover:text-[oklch(var(--foreground))]"
								>
									change
								</Button>
							</SubjectsDrawer>
						</div>
						<h3 className="text-[17px] font-semibold text-[oklch(var(--foreground))] leading-snug tracking-tight text-wrap balance">
							{topic}
						</h3>
					</div>

					<p className="text-[13px] text-[oklch(var(--muted-foreground))] leading-relaxed">
						{whyReason}
					</p>

					<Button
						size="sm"
						className={`w-full font-semibold text-[13px] h-9 hover:opacity-90 active:scale-[0.96] transition-transform`}
						onClick={handleStart}
						disabled={showSuccess}
					>
						<AnimatePresence mode="wait" initial={false}>
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
			</Card>
		</motion.div>
	);
}
