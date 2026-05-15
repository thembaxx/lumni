"use client";

import { ArrowCounterClockwise, House, Target } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { AccuracyBar } from "@/components/shared/accuracy-bar";
import { Button } from "@/components/ui/button";
import { calculateAccuracy } from "@/lib/shared/time";
import { iOSEase, springTransition } from "@/lib/utils/animation";
import { AnimatedIcon } from "@/lib/utils/icon-mapping";

interface StudySessionStats {
	total: number;
	correct?: number;
	review?: number;
}

interface SessionResultsProps {
	stats: StudySessionStats;
	onQuit?: () => void;
	onRestart?: () => void;
}

export function SessionResults({
	stats,
	onQuit,
	onRestart,
}: SessionResultsProps) {
	const accuracy = calculateAccuracy(stats.correct ?? 0, stats.total);

	return (
		<div className="min-h-[100dvh] bg-background grid grid-cols-12 gap-0">
			<div className="col-span-12 md:col-span-7 col-start-1 flex items-center justify-center p-4">
				<div className="max-w-md w-full mx-auto flex flex-col gap-4">
					<header className="text-left">
						<motion.div
							initial={{ scale: 0, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							transition={{ duration: 0.3 }}
							className="mb-2"
						>
							<AnimatedIcon name="success-check" className="size-16 mx-auto" />
						</motion.div>
						<h2 className="text-xl font-extrabold tracking-tight">
							Session Complete!
						</h2>
					</header>
					<div className="grid grid-cols-12 gap-3">
						<div className="col-span-5 p-4 rounded-lg bg-muted">
							<p className="text-2xl font-extrabold">{stats.total}</p>
							<p className="text-xs text-muted-foreground">Total</p>
						</div>
						{stats.correct !== undefined && (
							<div className="col-span-3 p-4 rounded-lg bg-success/10">
								<p className="text-2xl font-extrabold text-success">
									{stats.correct}
								</p>
								<p className="text-xs text-success">Known</p>
							</div>
						)}
						{stats.review !== undefined && (
							<div className="col-span-4 p-4 rounded-lg bg-warning/10">
								<p className="text-2xl font-extrabold text-warning">
									{stats.review}
								</p>
								<p className="text-xs text-warning">Review</p>
							</div>
						)}
					</div>
					{stats.correct !== undefined && (
						<div className="flex items-center gap-2">
							<Target className="size-4 text-success" />
							<span className="text-sm font-medium text-success">
								{accuracy}% accuracy
							</span>
						</div>
					)}
					<div className="flex gap-2">
						{onQuit && (
							<Button variant="outline" className="flex-1" onClick={onQuit}>
								<House data-icon="inline-start" />
								Dashboard
							</Button>
						)}
						{onRestart && (
							<Button className="flex-1" onClick={onRestart}>
								<ArrowCounterClockwise data-icon="inline-start" />
								Try Again
							</Button>
						)}
					</div>
				</div>
			</div>
			<div className="col-span-12 md:col-span-5 col-start-1 md:col-start-8 relative overflow-hidden bg-system-surface/30">
				<div className="absolute inset-0 bg-gradient-to-br from-success/10 via-transparent to-transparent" />
				<div className="absolute inset-0 flex items-center justify-center p-8">
					<div className="w-full h-full max-w-xs aspect-square rounded-3xl bg-success/10 blur-2xl animate-float-slow" />
				</div>
			</div>
		</div>
	);
}
