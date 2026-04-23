"use client";

import { IconFlame, IconTarget, IconTrendingUp } from "@tabler/icons-react";
import {
	domAnimation,
	LazyMotion,
	m,
	useSpring,
	useTransform,
} from "framer-motion";
import { useEffect } from "react";
import { Card } from "@/components/ui/card";

interface StatsCardsProps {
	streak: number;
	questionsAnswered: number;
	accuracy: number;
}

function AnimatedValue({
	target,
	delay = 0,
}: {
	target: number;
	delay?: number;
}) {
	const spring = useSpring(0, { stiffness: 100, damping: 20 });
	const display = useTransform(spring, (v) => Math.round(v));

	useEffect(() => {
		const t = setTimeout(() => spring.set(target), delay);
		return () => clearTimeout(t);
	}, [target, spring, delay]);

	return <m.span>{display}</m.span>;
}

export function StatsCards({
	streak,
	questionsAnswered,
	accuracy,
}: StatsCardsProps) {
	const stats = [
		{
			label: "Current Streak",
			value: streak,
			icon: IconFlame,
			color: "text-orange-500",
			bg: "bg-orange-500/10",
		},
		{
			label: "Questions",
			value: questionsAnswered,
			icon: IconTarget,
			color: "text-blue-500",
			bg: "bg-blue-500/10",
		},
		{
			label: "Accuracy",
			value: accuracy,
			icon: IconTrendingUp,
			color: "text-green-500",
			bg: "bg-green-500/10",
		},
	];

	return (
		<LazyMotion features={domAnimation}>
			<div className="grid grid-cols-3 gap-3">
				{stats.map((stat, index) => (
					<m.div
						key={stat.label}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: index * 0.1, duration: 0.4 }}
					>
						<Card className="p-4 flex flex-col h-full items-center justify-center gap-2">
							<m.div
								className={`p-2 rounded-full ${stat.bg}`}
								initial={{ scale: 0.95, opacity: 0 }}
								animate={{ scale: 1, opacity: 1 }}
								transition={{
									delay: index * 0.1 + 0.2,
									type: "spring",
									stiffness: 200,
								}}
							>
								<stat.icon className={`w-5 h-5 ${stat.color}`} />
							</m.div>
							<div className="text-center">
								<p className="text-2xl font-bold">
									<AnimatedValue
										target={stat.value}
										delay={index * 100 + 400}
									/>
								</p>
								<p className="text-xs text-muted-foreground line-clamp-2">
									{stat.label}
								</p>
							</div>
						</Card>
					</m.div>
				))}
			</div>
		</LazyMotion>
	);
}
