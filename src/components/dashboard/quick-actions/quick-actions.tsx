"use client";

import {
	IconBulb,
	IconFileDescription,
	IconPlane,
	IconSparkles,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";

const quickActions = [
	{ icon: IconFileDescription, label: "Exam papers" },
	{ icon: IconBulb, label: "Practice" },
	{ icon: IconSparkles, label: "Books" },
	{ icon: IconPlane, label: "Travel" },
];

export function QuickActions() {
	return (
		<ul className="flex items-center gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide animate-fade-in-up delay-400">
			{quickActions.map((action, index) => (
				<li key={action.label}>
					<Button
						variant="outline"
						className="rounded-full bg-secondary border-transparent text-foreground hover:bg-accent h-8 px-4 flex items-center gap-2 transition-all duration-200 btn-ghost-hover"
						style={{ animationDelay: `${450 + index * 50}ms` }}
					>
						<action.icon className="w-4 h-4 transition-transform duration-200 group-hover/button:scale-110" />
						<span className="text-sm">{action.label}</span>
					</Button>
				</li>
			))}
		</ul>
	);
}
