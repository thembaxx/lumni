"use client";

import {
	IconBook,
	IconBulb,
	IconFileDescription,
	IconRoute,
} from "@tabler/icons-react";
import { motion, useReducedMotion } from "framer-motion";
import { StudyPlanSheet } from "@/components/dashboard/study-plan-sheet";
import { LessonsButton } from "@/components/lesson";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { iOSEase } from "@/lib/utils/animation";

const quickActions = [
	{ icon: IconFileDescription, label: "Exams" },
	{ icon: IconRoute, label: "Study Plan" },
	{ icon: IconBulb, label: "Practice" },
	{ icon: IconBook, label: "Lessons" },
];

function ActionButton({
	icon: Icon,
	label,
	onClick,
}: {
	icon: React.ComponentType<{ className?: string }>;
	label: string;
	onClick?: () => void;
}) {
	const shouldReduceMotion = useReducedMotion();

	return (
		<motion.div
			whileHover={shouldReduceMotion ? {} : { scale: 1.03 }}
			whileTap={shouldReduceMotion ? {} : { scale: 0.96 }}
			transition={{ duration: 0.2, ease: iOSEase }}
		>
			<Button
				variant="ghost"
				onClick={onClick}
				className="h-11 px-5 rounded-lg border border-border/80 bg-secondary/60 gap-2.5 justify-start text-foreground hover:bg-accent hover:border-accent"
			>
				<motion.span
					whileHover={shouldReduceMotion ? {} : { rotate: [0, -10, 10, 0] }}
					transition={{ duration: 0.4, ease: iOSEase }}
					className="text-system-accent"
				>
					<Icon className="w-4 h-4" />
				</motion.span>
				<span className="text-sm font-medium">{label}</span>
			</Button>
		</motion.div>
	);
}

export function QuickActions({
	onPracticeClick,
}: {
	onPracticeClick?: () => void;
}) {
	return (
		<div className="w-full">
			<ul className="flex items-center gap-3 overflow-x-auto scrollbar-hide py-1">
				{quickActions.map((action) => (
					<li key={action.label} className="shrink-0">
						{action.label === "Study Plan" ? (
							<StudyPlanSheet />
						) : action.label === "Lessons" ? (
							<LessonsButton />
						) : action.label === "Practice" ? (
							<ActionButton
								icon={
									action.icon as React.ComponentType<{ className?: string }>
								}
								label={action.label}
								onClick={onPracticeClick}
							/>
						) : (
							<ActionButton
								icon={
									action.icon as React.ComponentType<{ className?: string }>
								}
								label={action.label}
							/>
						)}
					</li>
				))}
			</ul>
		</div>
	);
}
