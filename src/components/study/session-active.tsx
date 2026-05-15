"use client";

import { House, Target, Timer } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatTime } from "@/lib/shared/time";

interface StudySessionStats {
	total: number;
	correct?: number;
	review?: number;
}

interface SessionActivity {
	questionNumber: number;
	totalQuestions: number;
	elapsedTime: number;
	accuracy: number;
	progress: number;
}

interface SessionActiveProps {
	activity?: SessionActivity;
	stats?: StudySessionStats;
	onQuit?: () => void;
	children: React.ReactNode;
}

export function SessionActive({
	activity,
	onQuit,
	children,
}: SessionActiveProps) {
	const progressValue = activity?.progress ?? 0;

	return (
		<div className="min-h-[100dvh] bg-background p-4 flex flex-col gap-4">
			<div className="flex items-center justify-between gap-2 flex-wrap">
				{onQuit && (
					<Button variant="ghost" size="sm" onClick={onQuit}>
						Quit
					</Button>
				)}
				{activity && (
					<div className="flex items-center gap-2 flex-wrap">
						<div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/50">
							<Timer className="size-3.5 text-muted-foreground" />
							<span className="text-sm font-medium tabular-nums font-mono">
								{formatTime(activity.elapsedTime)}
							</span>
						</div>
						<span className="text-muted-foreground">|</span>
						<Badge variant="secondary" className="font-mono">
							{activity.questionNumber}/{activity.totalQuestions}
						</Badge>
						{activity.accuracy > 0 && (
							<>
								<span className="text-muted-foreground">|</span>
								<div className="flex items-center gap-1.5">
									<Target className="size-3.5 text-success" />
									<span className="text-sm font-semibold tabular-nums font-mono text-success">
										{activity.accuracy}%
									</span>
								</div>
							</>
						)}
					</div>
				)}
			</div>

			{progressValue > 0 && (
				<Progress value={progressValue} className="h-1.5" />
			)}

			{children}
		</div>
	);
}
