"use client";

import { IconBook, IconBulb, IconFileDescription } from "@tabler/icons-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { LessonsButton } from "@/components/lesson";
import { cn } from "@/lib/utils";

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
		<motion.div
			whileHover={{ scale: 1.02, y: -2 }}
			whileTap={{ scale: 0.97 }}
			transition={{ type: "spring", stiffness: 400, damping: 20 }}
			className={cn(
				"rounded-xl border bg-secondary/80 border-border/50 shadow-sm",
			)}
		>
			<Button
				variant="ghost"
				onClick={onClick}
				className="h-11 px-5 w-full justify-start gap-2.5 text-foreground hover:bg-accent hover:border-accent active:scale-[0.97]"
			>
				<span className="text-primary">
					<Icon className="w-4 h-4" />
				</span>
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
