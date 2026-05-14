"use client";

import { Lightning, Play, Timer } from "@phosphor-icons/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SubjectSelect } from "@/components/ui/subject-select";
import { useQuizSession } from "@/hooks/use-quiz-session";
import { formatTime } from "@/lib/utils/time";

interface QuizStartCardProps {
	onStart: (subject: string) => void;
}

export function QuizStartCard({ onStart }: QuizStartCardProps) {
	const [selectedSubject, setSelectedSubject] = useState("");
	const { state } = useQuizSession({ enabled: false });

	const handleStart = () => {
		if (selectedSubject) onStart(selectedSubject);
	};

	return (
		<Card
			className="overflow-hidden rounded-[1.5rem]"
			style={{ viewTransitionName: "practice-trigger" as string }}
		>
			<CardContent className="p-5 flex flex-col gap-4">
				<div className="flex items-center justify-between">
					<h3 className="text-lg font-extrabold tracking-tight">
						Start a Quiz
					</h3>
					<div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-muted/30 border border-muted">
						<div className="flex items-center gap-1.5">
							<Timer className="size-3.5 text-muted-foreground" />
							<span className="text-xs font-medium tabular-nums font-mono tracking-tight text-muted-foreground">
								{formatTime(state.elapsedTime)}
							</span>
						</div>
						<div className="w-px h-3 bg-muted" />
						<div className="flex items-center gap-1.5">
							<Lightning className="size-3.5 text-warning" />
							<span className="text-xs font-semibold tabular-nums font-mono text-muted-foreground">
								{state.points || 0}
							</span>
						</div>
					</div>
				</div>

				<SubjectSelect
					value={selectedSubject}
					onChange={setSelectedSubject}
					placeholder="Choose a subject to practice"
				/>

				<div className="flex items-center justify-between gap-4">
					<p className="text-sm text-muted-foreground">
						{selectedSubject
							? "Ready to test your knowledge?"
							: "Pick a subject above to begin"}
					</p>
					<Button
						size="lg"
						onClick={handleStart}
						disabled={!selectedSubject}
						className="rounded-full bg-system-accent hover:bg-system-accent/90 disabled:bg-muted disabled:cursor-not-allowed px-6 gap-2"
					>
						<Play className="size-4 ml-0.5 fill-current" />
						Start
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
