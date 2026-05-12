"use client";

import { CheckmarkCircle01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { iOSEase } from "@/lib/utils/animation";
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
		accent: "bg-destructive",
		iconColor: "text-destructive",
		bgAlpha: "bg-destructive/15",
	},
	due: {
		tag: "Due for review",
		accent: "bg-warning",
		iconColor: "text-warning",
		bgAlpha: "bg-warning/15",
	},
	streak: {
		tag: "Keep it hot",
		accent: "bg-success",
		iconColor: "text-success",
		bgAlpha: "bg-success/15",
	},
	balanced: {
		tag: "Balance mode",
		accent: "bg-info",
		iconColor: "text-info",
		bgAlpha: "bg-info/15",
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
				ease: iOSEase,
			}}
		>
			<Card className="relative overflow-hidden shadow-sm border-border/40 hover:border-border/80 transition-colors">
				<div className={`absolute top-0 left-0 right-0 h-1 ${config.accent}`} />

				<div className="p-5 space-y-4">
					<div className="flex items-center gap-3">
						<div
							className={`flex items-center justify-center size-10 rounded-xl ${config.bgAlpha}`}
						>
							<HugeiconsIcon
								icon={CheckmarkCircle01Icon}
								className={`size-5 ${config.iconColor}`}
							/>
						</div>
						<div className="space-y-0.5">
							<span className="text-[13px] font-bold text-foreground tracking-tight block">
								Today&apos;s Focus
							</span>
							<span className={`text-[12px] font-bold ${config.iconColor}`}>
								{config.tag}
							</span>
						</div>
					</div>

					<div className="space-y-2">
						<div className="flex items-center gap-2">
							<p className="text-[13px] text-primary font-bold">{subject}</p>
							<SubjectsDrawer onSelect={(name) => setSelectedSubject(name)}>
								<span className="text-[12px] text-muted-foreground hover:text-foreground cursor-pointer transition-colors font-medium">
									change
								</span>
							</SubjectsDrawer>
						</div>
						<h3 className="text-lg font-bold text-foreground leading-tight tracking-tight text-wrap balance">
							{topic}
						</h3>
					</div>

					<p className="text-[13px] text-muted-foreground leading-relaxed font-medium">
						{whyReason}
					</p>

					<Button
						size="sm"
						className="w-full font-bold text-[13px] h-10 hover:opacity-90 active:scale-[0.98] transition-all"
						onClick={handleStart}
						disabled={showSuccess}
					>
						<AnimatePresence mode="wait" initial={false}>
							{showSuccess ? (
								<motion.span
									key="success"
									initial={{ scale: 0.8, opacity: 0 }}
									animate={{ scale: 1, opacity: 1 }}
									exit={{ scale: 0.8, opacity: 0 }}
									transition={{
										duration: shouldReduceMotion ? 0 : 0.25,
										ease: iOSEase,
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
									initial={{ scale: 0.8, opacity: 0 }}
									animate={{ scale: 1, opacity: 1 }}
									exit={{ scale: 0.8, opacity: 0 }}
									transition={{
										duration: shouldReduceMotion ? 0 : 0.2,
										ease: iOSEase,
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
