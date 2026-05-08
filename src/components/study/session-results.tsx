"use client";

import { Home, RotateCcw, Target } from "lucide-react";
import { LottieWrapper } from "@/components/lottie";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calculateAccuracy } from "@/lib/utils/time";

interface StudySessionStats {
	total: number;
	correct?: number;
	review?: number;
}

interface SessionResultsProps {
	stats: StudySessionStats;
	onQuit?: () => void;
	onRestart?: () => void;
	useLottie?: boolean;
}

export function SessionResults({
	stats,
	onQuit,
	onRestart,
	useLottie = false,
}: SessionResultsProps) {
	const accuracy = calculateAccuracy(stats.correct ?? 0, stats.total);

	return (
		<div className="min-h-screen bg-background p-4 flex items-center justify-center">
			<Card className="max-w-md w-full">
				<CardHeader className="text-center">
					{useLottie && (
						<LottieWrapper
							animation="success-check"
							className="w-16 h-16 mx-auto mb-2"
						/>
					)}
					<CardTitle>Session Complete!</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-3 gap-4 text-center">
						<div className="p-4 rounded-lg bg-muted">
							<p className="text-2xl font-bold">{stats.total}</p>
							<p className="text-xs text-muted-foreground">Total</p>
						</div>
						{stats.correct !== undefined && (
							<div className="p-4 rounded-lg bg-green-500/10">
								<p className="text-2xl font-bold text-green-500">
									{stats.correct}
								</p>
								<p className="text-xs text-green-500">Known</p>
							</div>
						)}
						{stats.review !== undefined && (
							<div className="p-4 rounded-lg bg-amber-500/10">
								<p className="text-2xl font-bold text-amber-500">
									{stats.review}
								</p>
								<p className="text-xs text-amber-500">Review</p>
							</div>
						)}
					</div>
					{stats.correct !== undefined && (
						<div className="flex items-center justify-center gap-2">
							<Target className="size-4 text-green-500" />
							<span className="text-sm font-medium text-green-500">
								{accuracy}% accuracy
							</span>
						</div>
					)}
					<div className="flex gap-2">
						{onQuit && (
							<Button variant="outline" className="flex-1" onClick={onQuit}>
								<Home className="size-4 mr-2" />
								Dashboard
							</Button>
						)}
						{onRestart && (
							<Button className="flex-1" onClick={onRestart}>
								<RotateCcw className="size-4 mr-2" />
								Try Again
							</Button>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
