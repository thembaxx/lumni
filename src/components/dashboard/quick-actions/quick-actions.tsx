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
import { StudyPlanSheet } from "@/components/dashboard/study-plan-sheet";
import { LessonsButton } from "@/components/lesson";
import { ReferralSheet } from "@/components/referral/referral-sheet";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { iOSEase } from "@/lib/utils/animation";
import { useOptimizedAnimation } from "@/lib/utils/animation-optimization";

const quickActions = [
	{ icon: Brain02FreeIcons, label: "Practice", route: "/quiz", primary: true },
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
	primary,
}: {
	icon: readonly (readonly [
		string,
		{ readonly [key: string]: string | number },
	])[];
	label: string;
	onClick?: () => void;
	primary?: boolean;
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
			{primary ? (
				<Button className="h-11 justify-start gap-2.5 rounded-card-lg px-5 text-white">
					<span>
						<HugeiconsIcon
							icon={icon}
							className="size-4"
							data-icon
							aria-hidden="true"
						/>
					</span>
					<span className="font-medium text-sm">{label}</span>
				</Button>
			) : (
				<Button
					variant="secondary"
					className="h-11 justify-start gap-2.5 rounded-card-lg border border-border/80 bg-system-background-secondary px-5 text-foreground hover:border-accent hover:bg-accent"
				>
					<span className="text-accent">
						<HugeiconsIcon
							icon={icon}
							className="size-4 text-foreground"
							data-icon
							aria-hidden="true"
						/>
					</span>
					<span className="font-medium text-sm">{label}</span>
				</Button>
			)}
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
								primary={action.primary}
							/>
						)}
					</li>
				))}
			</ul>
		</div>
	);
}
