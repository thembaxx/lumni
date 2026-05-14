"use client";

import { ArrowsClockwise, House } from "@phosphor-icons/react";
import {
	AnimatePresence,
	LazyMotion,
	m,
	useSpring,
	useTransform,
} from "framer-motion";
import { AnimatedIcon } from "@/lib/utils/icon-mapping";
import { AccuracyBar } from "@/components/shared/accuracy-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { iOSEase, springTransition } from "@/lib/utils/animation";

interface QuizResultProps {
	results: {
		totalQuestions: number;
		correctAnswers: number;
		accuracy: number;
		incorrectAnswers: {
			questionId: string;
			selectedAnswer: string;
			correctAnswer: string;
		}[];
	};
	onRestart: () => void;
	onClose?: () => void;
}

function AnimatedCounter({
	value,
	delay = 0,
}: {
	value: number;
	delay?: number;
}) {
	const spring = useSpring(0, { stiffness: 100, damping: 20 });
	const display = useTransform(spring, (current) => Math.round(current));

	return <m.span>{display}</m.span>;
}

function Confetti() {
	const particles = Array.from({ length: 12 }, (_, i) => ({
		id: i,
		x: ((i * 17 + 5) % 200) - 100,
		delay: i * 0.05,
		color: [
			"oklch(64.8% 0.173 142°)",
			"oklch(57.7% 0.184 146°)",
			"oklch(78.6% 0.156 80°)",
			"oklch(62.2% 0.195 348°)",
			"oklch(53.5% 0.182 86°)",
		][i % 5],
	}));
	return (
		<div className="absolute inset-0 pointer-events-none overflow-hidden">
			{particles.map((p) => (
				<m.div
					key={p.id}
					className="absolute w-2 h-2 rounded-full"
					style={{
						left: "50%",
						top: "50%",
						backgroundColor: p.color,
					}}
					initial={{ scale: 0.95, opacity: 0 }}
					animate={{
						scale: [0, 1, 0],
						opacity: [1, 1, 0],
						x: [0, p.x],
						y: [-20, -80, -120],
						rotate: [0, 360],
					}}
					transition={{
						duration: 0.8,
						delay: p.delay,
						ease: iOSEase,
					}}
				/>
			))}
		</div>
	);
}

function getMessage(accuracy: number) {
	if (accuracy >= 90)
		return {
			title: "Outstanding!",
			icon: "level-up" as const,
			celebration: true,
		};
	if (accuracy >= 70)
		return {
			title: "Great job!",
			icon: "confetti" as const,
			celebration: false,
		};
	if (accuracy >= 50)
		return {
			title: "Good effort!",
			icon: "success-check" as const,
			celebration: false,
		};
	return {
		title: "Keep practicing!",
		icon: "error-state" as const,
		celebration: false,
	};
}

export function QuizResult({
	results,
	onRestart,
	onClose,
}: QuizResultProps) {
	const { totalQuestions, correctAnswers, accuracy, incorrectAnswers } =
		results;

	const message = getMessage(accuracy);

	return (
		<m.div
			initial={{ opacity: 0, scale: 0.9 }}
			animate={{ opacity: 1, scale: 1 }}
			transition={{ duration: 0.4, ease: iOSEase }}
			className="flex flex-col gap-6"
		>
			<Card className="p-8 flex flex-col items-center text-center gap-4 overflow-visible">
				{message.celebration && <Confetti />}
				<m.div
					initial={{ scale: 0.95, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					transition={{ delay: 0.2, ...springTransition }}
				>
					<AnimatedIcon name={message.icon} className="size-20" />
				</m.div>
				<m.h2
					className="text-2xl font-extrabold"
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.3 }}
				>
					{message.title}
				</m.h2>

				<div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-xs">
					<m.div
						className="flex flex-col items-center"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.4 }}
					>
						<p className="text-3xl font-extrabold text-success">
							<AnimatedCounter value={correctAnswers} delay={500} />
						</p>
						<p className="text-xs text-muted-foreground">Correct</p>
					</m.div>
					<m.div
						className="flex flex-col items-center"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.5 }}
					>
						<p className="text-3xl font-extrabold text-destructive">
							<AnimatedCounter
								value={totalQuestions - correctAnswers}
								delay={600}
							/>
						</p>
						<p className="text-xs text-muted-foreground">Incorrect</p>
					</m.div>
				</div>

				<m.div
					className="w-full"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.6 }}
				>
					<AccuracyBar
						accuracy={accuracy}
						variant="animated"
						showLabel={true}
					/>
				</m.div>

				{incorrectAnswers.length > 0 && (
					<m.div
						className="w-full pt-4 border-t"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.8 }}
					>
						<p className="text-sm font-medium mb-2">Review:</p>
						<div className="flex flex-col gap-1 text-left">
							{incorrectAnswers.slice(0, 3).map((item, idx) => (
								<p
									key={`review-${item.questionId || idx}`}
									className="text-xs text-muted-foreground"
								>
									Q{idx + 1}: You answered {item.selectedAnswer}, correct was{" "}
									{item.correctAnswer}
								</p>
							))}
						</div>
					</m.div>
				)}
			</Card>

			<m.div
				className="flex gap-2"
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.9 }}
			>
				<Button variant="outline" className="flex-1" onClick={onRestart}>
					<ArrowsClockwise data-icon="inline-start" />
					Try Again
				</Button>
				{onClose && (
					<Button className="flex-1" onClick={onClose}>
						<House data-icon="inline-start" />
						Dashboard
					</Button>
				)}
			</m.div>
		</m.div>
	);
}