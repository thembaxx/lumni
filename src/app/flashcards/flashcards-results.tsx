"use client";

import { Home, RotateCcw, Target } from "lucide-react";
import { useEffect, useState } from "react";
import { Confetti } from "@/components/celebration";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FlashcardsResultsProps {
	totalCards: number;
	knownCount: number;
	reviewCount: number;
	onGoHome: () => void;
	onRestart: () => void;
}

export function FlashcardsResults({
	totalCards,
	knownCount,
	reviewCount,
	onGoHome,
	onRestart,
}: FlashcardsResultsProps) {
	const accuracy =
		totalCards > 0 ? Math.round((knownCount / totalCards) * 100) : 0;
	const didWell = accuracy >= 70;
	const [showConfetti, setShowConfetti] = useState(false);

	useEffect(() => {
		if (didWell) {
			setShowConfetti(true);
			setTimeout(() => setShowConfetti(false), 2500);
		}
	}, [didWell]);

	return (
		<>
			<Confetti trigger={showConfetti} count={40} duration={2000} />
			<div className="min-h-screen bg-background p-4 flex items-center justify-center">
				<Card className="max-w-md w-full">
					<CardHeader className="text-center">
						<CardTitle>Session Complete!</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-3 gap-4 text-center">
							<div className="p-4 rounded-lg bg-muted">
								<p className="text-2xl font-bold">{totalCards}</p>
								<p className="text-xs text-muted-foreground">Total</p>
							</div>
							<div className="p-4 rounded-lg bg-green-500/10">
								<p className="text-2xl font-bold text-green-500">
									{knownCount}
								</p>
								<p className="text-xs text-green-500">Known</p>
							</div>
							<div className="p-4 rounded-lg bg-amber-500/10">
								<p className="text-2xl font-bold text-amber-500">
									{reviewCount}
								</p>
								<p className="text-xs text-amber-500">Review</p>
							</div>
						</div>
						<div className="flex items-center justify-center gap-2">
							<Target className="size-4 text-green-500" />
							<span className="text-sm font-medium text-green-500">
								{accuracy}% accuracy
							</span>
						</div>
						<div className="flex gap-2">
							<Button variant="outline" className="flex-1" onClick={onGoHome}>
								<Home className="size-4 mr-2" />
								Dashboard
							</Button>
							<Button className="flex-1" onClick={onRestart}>
								<RotateCcw className="size-4 mr-2" />
								Try Again
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		</>
	);
}
