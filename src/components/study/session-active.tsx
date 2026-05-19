"use client";

import { Target01Icon, Timer01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
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
		<div className="flex min-h-[100dvh] flex-col gap-4 bg-background p-4">
			<div className="flex flex-wrap items-center justify-between gap-2">
				{onQuit && (
					<Button variant="ghost" size="sm" onClick={onQuit}>
						Quit
					</Button>
				)}
				{activity && (
					<div className="flex flex-wrap items-center gap-2">
						<div className="flex items-center gap-1.5 rounded-full bg-muted/50 px-2.5 py-1">
							<HugeiconsIcon
								icon={Timer01Icon}
								className="size-3.5 text-muted-foreground"
							/>
							<span className="font-medium font-mono text-sm tabular-nums">
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
									<HugeiconsIcon
										icon={Target01Icon}
										className="size-3.5 text-success"
									/>
									<span className="font-mono font-semibold text-sm text-success tabular-nums">
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
