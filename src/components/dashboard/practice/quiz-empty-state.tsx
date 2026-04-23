"use client";

import { PuzzleIcon } from "lucide-react";

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

function AnimatedDots() {
	return (
		<div className="flex items-center gap-1.5">
			<span
				className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40"
				style={{ animation: "pulse-dot 1s ease-out infinite" }}
			/>
			<span
				className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40"
				style={{ animation: "pulse-dot 1s ease-out infinite 150ms" }}
			/>
			<span
				className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40"
				style={{ animation: "pulse-dot 1s ease-out infinite 300ms" }}
			/>
		</div>
	);
}
