"use client";

import { IconBook, IconBulb, IconFileDescription } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { LessonsButton } from "@/components/lesson";
import { Button } from "@/components/ui/button";

const quickActions = [
	{ icon: IconFileDescription, label: "Exam papers" },
	{ icon: IconBulb, label: "Practice" },
	{ icon: IconBook, label: "Lessons" },
];

export function QuickActions() {
	const router = useRouter();

	return (
		<ul className="flex items-center gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide animate-fade-in-up delay-400">
			{quickActions.map((action, index) => (
				<li key={action.label}>
					{action.label === "Lessons" ? (
						<LessonsButton />
					) : action.label === "Practice" ? (
						<Button
							variant="outline"
							className="rounded-full bg-secondary border-transparent text-foreground hover:bg-accent h-8 px-4 flex items-center gap-2 quick-action-btn"
							style={{ animationDelay: `${450 + index * 50}ms` }}
							onClick={() => router.push("/quiz")}
						>
							<span className="quick-action-icon">
								<action.icon className="w-4 h-4" />
							</span>
							<span className="text-sm">{action.label}</span>
						</Button>
					) : (
						<Button
							variant="outline"
							className="rounded-full bg-secondary border-transparent text-foreground hover:bg-accent h-8 px-4 flex items-center gap-2 quick-action-btn"
							style={{ animationDelay: `${450 + index * 50}ms` }}
						>
							<span className="quick-action-icon">
								<action.icon className="w-4 h-4" />
							</span>
							<span className="text-sm">{action.label}</span>
						</Button>
					)}
				</li>
			))}
		</ul>
	);
}
