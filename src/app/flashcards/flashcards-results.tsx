"use client";

import { House, ArrowCounterClockwise, Target } from "@phosphor-icons/react";
import { Confetti } from "@/components/celebration";
import { LottieWrapper } from "@/components/lottie/lottie-wrapper";
import { Button } from "@/components/ui/button";

interface FlashcardsResultsProps {
	totalCards: number;
	knownCount: number;
	reviewCount: number;
	onGoHouse: () => void;
	onRestart: () => void;
}

export function FlashcardsResults({
	totalCards,
	knownCount,
	reviewCount,
	onGoHouse,
	onRestart,
}: FlashcardsResultsProps) {
	const accuracy =
		totalCards > 0 ? Math.round((knownCount / totalCards) * 100) : 0;
	const didWell = accuracy >= 70;

	return (
		<>
			<Confetti trigger={didWell} count={40} duration={2000} />
			<div className="min-h-[100dvh] bg-background grid grid-cols-12 gap-0">
				<div className="col-span-12 md:col-span-7 col-start-1 flex items-center justify-center p-4">
					<div className="max-w-md w-full mx-auto">
						<div className="space-y-4">
							<header className="text-left">
								<h2 className="text-xl font-bold tracking-tight">Session Complete!</h2>
							</header>
							<div className="grid grid-cols-12 gap-3">
								<div className="col-span-8 sm:col-span-8 p-4 rounded-lg bg-muted">
									<p className="text-2xl font-bold">{totalCards}</p>
									<p className="text-xs text-muted-foreground">Total</p>
								</div>
								<div className="col-span-4 sm:col-span-4 p-4 rounded-lg bg-success/10 dark:bg-success/20">
									<p className="text-xl font-bold text-success dark:text-success-foreground">
										{knownCount}
									</p>
									<p className="text-xs text-success dark:text-success-foreground">
										Known
									</p>
								</div>
								<div className="col-span-12 sm:col-span-4 p-4 rounded-lg bg-warning/10 dark:bg-warning/20">
									<p className="text-xl font-bold text-warning dark:text-warning-foreground">
										{reviewCount}
									</p>
									<p className="text-xs text-warning dark:text-warning-foreground">
										Review
									</p>
								</div>
								<div className="col-span-12 flex items-center gap-2">
									<Target className="size-4 text-success dark:text-success-foreground" />
									<span className="text-sm font-medium text-success dark:text-success-foreground">
										{accuracy}% accuracy
									</span>
								</div>
								<div className="col-span-12 flex gap-2">
									<Button variant="outline" className="flex-1" onClick={onGoHouse}>
										<House className="size-4 mr-2" />
										Dashboard
									</Button>
									<Button className="flex-1" onClick={onRestart}>
										<ArrowCounterClockwise className="size-4 mr-2" />
										Try Again
									</Button>
								</div>
							</div>
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
		</>
	);
}
