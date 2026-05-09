"use client";

import { PuzzleIcon } from "lucide-react";
import { AnimatedDots } from "@/components/shared/animated-dots";

export function SubjectNotSelectedState() {
	return (
		<div className="mt-24 flex flex-col items-center gap-4 animate-fade-in-scale">
			<div className="relative flex items-center justify-center">
				<div className="absolute size-20 rounded-full bg-muted/40 animate-pulse" />
				<div className="relative flex items-center justify-center size-20 rounded-full border border-dashed border-muted-foreground/20 bg-muted/20">
					<PuzzleIcon className="size-8 text-muted-foreground/40" />
				</div>
			</div>
			<div className="text-center space-y-1.5">
				<p className="text-sm font-medium text-muted-foreground">
					Select a subject to begin
				</p>
				<p className="text-xs text-muted-foreground/60">
					Choose a subject above to start your quiz
				</p>
			</div>
			<AnimatedDots />
		</div>
	);
}
