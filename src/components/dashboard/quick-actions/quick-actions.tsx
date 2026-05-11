"use client";

import { IconBook, IconBulb, IconFileDescription } from "@tabler/icons-react";
import { LessonsButton } from "@/components/lesson";
import { Button } from "@/components/ui/button";
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
		<div className="rounded-[12px] border bg-[--system-surface-secondary] border-[--system-separator]">
			<Button
				variant="ghost"
				onClick={onClick}
				className="h-10 pl-3 pr-5 w-full justify-start gap-2.5 text-[--system-text-primary]"
			>
				<span className="text-primary">
					<Icon className="w-4 h-4" />
				</span>
				<span className="text-sm font-medium">{label}</span>
			</Button>
		</div>
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
				{quickActions.map((action) => (
					<li key={action.label}>
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
					</li>
				))}
			</ul>
		</div>
	);
}
