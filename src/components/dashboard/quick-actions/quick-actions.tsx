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
		<div className="space-y-3">
			<p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">
				Quick actions
			</p>
			<ul className="flex items-center gap-3 overflow-x-auto scrollbar-hide animate-fade-in-up delay-400">
				{quickActions.map((action, index) => (
					<li key={action.label}>
						{action.label === "Lessons" ? (
							<LessonsButton />
						) : action.label === "Practice" ? (
							<Button
								variant="outline"
								className="rounded-xl bg-secondary/80 border-border/50 text-foreground hover:bg-accent hover:border-accent h-10 px-5 flex items-center gap-2.5 quick-action-btn shadow-sm"
								style={{ animationDelay: `${450 + index * 50}ms` }}
								onClick={() => router.push("/quiz")}
							>
								<span className="quick-action-icon text-primary">
									<action.icon className="w-4 h-4" />
								</span>
								<span className="text-sm font-medium">{action.label}</span>
							</Button>
						) : (
							<Button
								variant="outline"
								className="rounded-xl bg-secondary/80 border-border/50 text-foreground hover:bg-accent hover:border-accent h-10 px-5 flex items-center gap-2.5 quick-action-btn shadow-sm"
								style={{ animationDelay: `${450 + index * 50}ms` }}
							>
								<span className="quick-action-icon text-primary">
									<action.icon className="w-4 h-4" />
								</span>
								<span className="text-sm font-medium">{action.label}</span>
							</Button>
						)}
					</li>
				))}
			</ul>
		</div>
	);
}
