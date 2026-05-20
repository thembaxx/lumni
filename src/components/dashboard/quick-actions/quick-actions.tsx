"use client";

import {
	Book02FreeIcons,
	Book03FreeIcons,
	BookOpenCheckFreeIcons,
	Brain02FreeIcons,
	Calendar02FreeIcons,
	DocumentValidationFreeIcons,
	Share07Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { m, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { StudyPlanSheet } from "@/components/dashboard/study-plan-sheet";
import { LessonsButton } from "@/components/lesson";
import { ReferralSheet } from "@/components/referral/referral-sheet";
import { PerpetualFloat } from "@/components/shared/perpetual-float";
import { Button } from "@/components/ui/button";
import { iOSEase } from "@/lib/utils/animation";
import { useOptimizedAnimation } from "@/lib/utils/animation-optimization";

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
	{ icon: Share07Icon, label: "Invite Friend" },
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
	const { shouldReduceMotion: shouldReduceMotionOpt } = useOptimizedAnimation();
	const finalShouldReduceMotion = shouldReduceMotion || shouldReduceMotionOpt;

	return (
		<m.div
			whileHover={finalShouldReduceMotion ? {} : { scale: 1.03 }}
			whileTap={finalShouldReduceMotion ? {} : { scale: 0.96 }}
			transition={{ duration: 0.2, ease: iOSEase }}
			role="button"
			tabIndex={onClick ? 0 : -1}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					onClick?.();
				}
			}}
			onClick={onClick}
			aria-label={label}
		>
			<Button
				variant="secondary"
				className="h-11 justify-start gap-2.5 rounded-[2.5rem] border border-border/80 bg-system-background-secondary px-5 text-foreground hover:border-accent hover:bg-accent"
			>
				<m.span
					whileHover={
						finalShouldReduceMotion ? {} : { rotate: [0, -10, 10, 0] }
					}
					transition={{ duration: 0.4, ease: iOSEase }}
					className="text-accent"
				>
					<PerpetualFloat floatRange={1.5} speed={3}>
						<HugeiconsIcon
							icon={icon}
							className="size-4 text-foreground"
							data-icon
							aria-hidden="true"
						/>
					</PerpetualFloat>
				</m.span>
				<span className="font-medium text-sm">{label}</span>
			</Button>
		</m.div>
	);
}

export function QuickActions() {
	const { push } = useRouter();

	return (
		<div className="w-full">
			<ul className="scrollbar-hide flex items-center gap-3 overflow-x-auto py-1">
				{quickActions.map((action) => (
					<li key={action.label} className="shrink-0">
						{action.label === "Study Plan" ? (
							<StudyPlanSheet />
						) : action.label === "Lessons" ? (
							<LessonsButton />
						) : action.label === "Invite Friend" ? (
							<ReferralSheet />
						) : (
							<ActionButton
								icon={action.icon}
								label={action.label}
								onClick={() => push(action.route ?? "/")}
							/>
						)}
					</li>
				))}
			</ul>
		</div>
	);
}
