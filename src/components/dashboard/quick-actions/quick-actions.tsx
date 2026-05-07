"use client";

import { IconBook, IconBulb, IconFileDescription } from "@tabler/icons-react";
import { motion } from "framer-motion";
import { LessonsButton } from "@/components/lesson";

const quickActions = [
	{ icon: IconFileDescription, label: "Exams" },
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
	return (
		<motion.button
			onClick={onClick}
			className="rounded-xl bg-secondary/80 border border-border/50 text-foreground hover:bg-accent hover:border-accent h-11 px-5 flex items-center gap-2.5 shadow-sm active:scale-[0.97] transition-all"
			whileHover={{ scale: 1.02, y: -2 }}
			whileTap={{ scale: 0.97 }}
			transition={{ type: "spring", stiffness: 400, damping: 20 }}
		>
			<motion.span
				className="text-primary"
				whileHover={{ scale: 1.15, rotate: 5 }}
				transition={{ type: "spring", stiffness: 400, damping: 20 }}
			>
				<Icon className="w-4 h-4" />
			</motion.span>
			<span className="text-sm font-medium">{label}</span>
		</motion.button>
	);
}

export function QuickActions({
	onPracticeClick,
}: {
	onPracticeClick?: () => void;
}) {
	return (
		<div>
			<ul className="flex items-center gap-3 overflow-x-auto scrollbar-hide py-1">
				{quickActions.map((action, index) => (
					<motion.li
						key={action.label}
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{
							delay: 0.3 + index * 0.08,
							type: "spring",
							stiffness: 300,
							damping: 30,
						}}
					>
						{action.label === "Lessons" ? (
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
					</motion.li>
				))}
			</ul>
		</div>
	);
}
