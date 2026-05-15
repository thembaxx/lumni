"use client";

import {
	Book02FreeIcons,
	Book03FreeIcons,
	BookOpenCheckFreeIcons,
	Brain02FreeIcons,
	Calendar02FreeIcons,
	DocumentValidationFreeIcons,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { StudyPlanSheet } from "@/components/dashboard/study-plan-sheet";
import { LessonsButton } from "@/components/lesson";
import { PerpetualFloat } from "@/components/shared/perpetual-float";
import { Button } from "@/components/ui/button";
import { iOSEase } from "@/lib/utils/animation";

const quickActions = [
	{ icon: Brain02FreeIcons, label: "Practice", route: "/quiz" },
	{
		icon: DocumentValidationFreeIcons,
		label: "Exam Papers",
		route: "/past-papers",
	},
	{ icon: Calendar02FreeIcons, label: "Study Plan" },
	{ icon: Book02FreeIcons, label: "Bookmarks", route: "/bookmarks" },
	{ icon: BookOpenCheckFreeIcons, label: "Review", route: "/review" },
	{ icon: Book03FreeIcons, label: "Lessons" },
];

function ActionButton({
	icon,
	label,
	onClick,
}: {
	icon: readonly (readonly [
		string,
		{ readonly [key: string]: string | number },
	])[];
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
				className="h-11 px-5 rounded-[2.5rem] border border-border/80 bg-secondary/60 gap-2.5 justify-start text-foreground hover:bg-accent hover:border-accent"
			>
				<motion.span
					whileHover={shouldReduceMotion ? {} : { rotate: [0, -10, 10, 0] }}
					transition={{ duration: 0.4, ease: iOSEase }}
					className="text-accent"
				>
					<PerpetualFloat floatRange={1.5} speed={3}>
						<HugeiconsIcon
							icon={icon}
							className="size-4  text-foreground"
							data-icon
						/>
					</PerpetualFloat>
				</motion.span>
				<span className="text-sm font-medium">{label}</span>
			</Button>
		</motion.div>
	);
}

export function QuickActions() {
	const router = useRouter();

	return (
		<div className="w-full">
			<ul className="flex items-center gap-3 overflow-x-auto scrollbar-hide py-1">
				{quickActions.map((action) => (
					<li key={action.label} className="shrink-0">
						{action.label === "Study Plan" ? (
							<StudyPlanSheet />
						) : action.label === "Lessons" ? (
							<LessonsButton />
						) : (
							<ActionButton
								icon={action.icon}
								label={action.label}
								onClick={() => router.push(action.route!)}
							/>
						)}
					</li>
				))}
			</ul>
		</div>
	);
}
