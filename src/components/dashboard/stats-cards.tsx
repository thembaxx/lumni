"use client";

import { IconTarget, IconTrendingUp } from "@tabler/icons-react";
import {
	motion,
	useMotionValue,
	useReducedMotion,
	useSpring,
	useTransform,
} from "framer-motion";
import { useEffect } from "react";
import { type LottieAnimationName, LottieWrapper } from "@/components/lottie";
import { Card } from "@/components/ui/card";
import { iOSEase } from "@/lib/utils/animation";

interface StatsCardsProps {
	questionsAnswered: number;
	accuracy: number;
}

interface StatItemProps {
	label: string;
	value: number;
	icon: React.ComponentType<{ className?: string }>;
	animation?: LottieAnimationName;
	colorClass: string;
	accentClass: string;
	index: number;
}
function AnimatedNumber({
	value,
	shouldReduceMotion,
}: {
	value: number;
	shouldReduceMotion: boolean | null;
}) {
	const motionValue = useMotionValue(0);
	const springValue = useSpring(motionValue, {
		stiffness: 80,
		damping: 20,
	});
	const rounded = useTransform(springValue, (v) => Math.round(v));

	useEffect(() => {
		motionValue.set(value);
	}, [value, motionValue]);

	if (shouldReduceMotion) {
		return <>{value}</>;
	}

	return <motion.span>{rounded}</motion.span>;
}

function StatCard({
	label,
	value,
	icon: Icon,
	animation,
	colorClass,
	accentClass,
	index,
}: StatItemProps) {
	const shouldReduceMotion = useReducedMotion();

	return (
		<motion.div
			initial={{ opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{
				duration: shouldReduceMotion ? 0 : 0.35,
				ease: iOSEase,
				delay: shouldReduceMotion ? 0 : index * 0.05,
			}}
		>
			<Card className="relative p-5 flex flex-col h-full items-center justify-start gap-3 cursor-default border shadow-sm border-border/80 hover:border-border/80 transition-colors">
				<div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-system-surface shadow-level-1">
					{animation ? (
						<LottieWrapper animation={animation} className="w-5 h-5" loop />
					) : (
						<Icon className={`w-5 h-5 ${colorClass}`} />
					)}
				</div>

				<div className="text-center space-y-1">
					<p className="text-2xl font-bold tracking-tight text-foreground tabular-nums text-wrap balance">
						<AnimatedNumber
							value={value}
							shouldReduceMotion={shouldReduceMotion}
						/>
					</p>
					<p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold leading-tight">
						{label}
					</p>
				</div>
			</Card>
		</motion.div>
	);
}

export function StatsCards({ questionsAnswered, accuracy }: StatsCardsProps) {
	return (
		<div className="grid grid-cols-2 gap-2 sm:gap-3">
			<StatCard
				label="Answered"
				value={questionsAnswered}
				icon={IconTarget}
				animation="loading-dots"
				colorClass="text-info"
				accentClass="bg-info"
				index={0}
			/>
			<StatCard
				label="Accuracy"
				value={accuracy}
				icon={IconTrendingUp}
				animation="success-check"
				colorClass="text-success"
				accentClass="bg-success"
				index={1}
			/>
		</div>
	);
}
