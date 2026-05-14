"use client";

import { Target, TrendUp } from "@phosphor-icons/react";
import {
	motion,
	useMotionValue,
	useReducedMotion,
	useSpring,
	useTransform,
} from "framer-motion";
import { useEffect } from "react";
import { type LottieAnimationName, LottieWrapper } from "@/components/lottie";
import { PerpetualFloat } from "@/components/shared/perpetual-float";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

	return <motion.span aria-live="polite">{rounded}</motion.span>;
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
			<Card className="relative h-full cursor-default hover:border-border/80 transition-colors gap-3 py-5">
				<CardHeader className="flex flex-col items-center justify-center border-t-0 px-5 pt-0">
					<div className="relative flex items-center justify-center size-10 rounded-full bg-system-surface shadow-level-1">
						{animation ? (
							<PerpetualFloat floatRange={2} speed={4}>
								<LottieWrapper animation={animation} className="size-5" loop />
							</PerpetualFloat>
						) : (
							<PerpetualFloat floatRange={2} speed={4}>
								<Icon className={`size-5 ${colorClass}`} />
							</PerpetualFloat>
						)}
					</div>
				</CardHeader>
				<CardContent className="text-center space-y-1 px-5 pb-0">
					<p className="text-2xl font-bold tracking-tight text-foreground tabular-nums text-wrap balance">
						<AnimatedNumber
							value={value}
							shouldReduceMotion={shouldReduceMotion}
						/>
					</p>
					<p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold leading-tight">
						{label}
					</p>
				</CardContent>
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
				icon={Target}
				animation="loading-dots"
				colorClass="text-info"
				accentClass="bg-info"
				index={0}
			/>
			<StatCard
				label="Accuracy"
				value={accuracy}
				icon={TrendUp}
				animation="success-check"
				colorClass="text-success"
				accentClass="bg-success"
				index={1}
			/>
		</div>
	);
}
