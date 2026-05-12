"use client";

import { useState } from "react";
import { LessonLibrary } from "@/components/lesson";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";

export function StudyPlanSheet() {
	const [open, setOpen] = useState(false);

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetTrigger className="h-11 px-5 rounded-lg border border-border/50 bg-secondary/60 gap-2.5 inline-flex items-center justify-center text-foreground hover:bg-accent hover:border-accent shadow-sm transition-colors">
				<span className="text-[--system-accent]">
					<svg
						className="w-4 h-4"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<path d="M12 2L2 7l10 5 10-5-10-5z" />
						<path d="M2 17l10 5 10-5" />
						<path d="M2 12l10 5 10-5" />
					</svg>
				</span>
				<span className="text-sm font-bold">Study Plan</span>
			</SheetTrigger>
			<SheetContent
				className="sm:max-w-135 w-full h-dvh px-4 rounded-t-none"
				side="bottom"
			>
				<SheetHeader className="text-left">
					<SheetTitle>Study Plan</SheetTitle>
					<SheetDescription>
						Personalized learning path based on your progress
					</SheetDescription>
				</SheetHeader>
				<div className="px-4 pb-4 grow max-h-[95dvh] overflow-y-auto">
					<LessonLibrary />
				</div>
			</SheetContent>
		</Sheet>
	);
}
