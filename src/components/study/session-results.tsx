"use client";

import { Home01Icon, Target01Icon, UndoIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { m } from "framer-motion";
import { Button } from "@/components/ui/button";
import { calculateAccuracy } from "@/lib/shared/time";
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
		<div className="grid min-h-dvh grid-cols-12 gap-0 bg-background">
			<div className="col-span-12 col-start-1 flex items-center justify-center p-4 md:col-span-7">
				<div className="mx-auto flex w-full max-w-md flex-col gap-4">
					<header className="text-left">
						<m.div
							initial={{ scale: 0.95, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							transition={{ duration: 0.3 }}
							className="mb-2"
						>
							<AnimatedIcon name="success-check" className="mx-auto size-16" />
						</m.div>
						<h2 className="font-semibold text-xl tracking-tight">
							Session Complete!
						</h2>
					</header>
					<div className="grid grid-cols-12 gap-3">
						<div className="col-span-5 rounded-lg bg-muted p-4">
							<p className="font-extrabold text-2xl">{stats.total}</p>
							<p className="text-muted-foreground text-xs">Total</p>
						</div>
						{stats.correct !== undefined && (
							<div className="col-span-3 rounded-lg bg-success/10 p-4">
								<p className="font-extrabold text-2xl text-success">
									{stats.correct}
								</p>
								<p className="text-success text-xs">Known</p>
							</div>
						)}
						{stats.review !== undefined && (
							<div className="col-span-4 rounded-lg bg-warning/10 p-4">
								<p className="font-extrabold text-2xl text-warning">
									{stats.review}
								</p>
								<p className="text-warning text-xs">Review</p>
							</div>
						)}
					</div>
					{stats.correct !== undefined && (
						<div className="flex items-center gap-2">
							<HugeiconsIcon
								icon={Target01Icon}
								className="size-4 text-success"
							/>
							<span className="font-medium text-sm text-success">
								{accuracy}% accuracy
							</span>
						</div>
					)}
					<div className="flex gap-2">
						{onQuit && (
							<Button variant="outline" className="flex-1" onClick={onQuit}>
								<HugeiconsIcon icon={Home01Icon} data-icon="inline-start" />
								Dashboard
							</Button>
						)}
						{onRestart && (
							<Button className="flex-1" onClick={onRestart}>
								<HugeiconsIcon icon={UndoIcon} data-icon="inline-start" />
								Try Again
							</Button>
						)}
					</div>
				</div>
			</div>
			<div className="relative col-span-12 col-start-1 overflow-hidden bg-system-surface/30 md:col-span-5 md:col-start-8">
				<div className="absolute inset-0 bg-gradient-to-br from-success/10 via-transparent to-transparent" />
				<div className="absolute inset-0 flex items-center justify-center p-8">
					<div className="aspect-square h-full w-full max-w-xs animate-float-slow rounded-3xl bg-success/10 blur-2xl" />
				</div>
			</div>
		</div>
	);
}
