"use client";

import { IconFlame, IconTarget, IconTrendingUp } from "@tabler/icons-react";
import {
	domAnimation,
	LazyMotion,
	m,
	useSpring,
	useTransform,
} from "framer-motion";
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
			colorClass: "text-warning",
			bgClass: "bg-warning/10",
		},
		{
			label: "Questions",
			value: questionsAnswered,
			icon: IconTarget,
			colorClass: "text-info",
			bgClass: "bg-info/10",
		},
		{
			label: "Accuracy",
			value: accuracy,
			icon: IconTrendingUp,
			colorClass: "text-success",
			bgClass: "bg-success/10",
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
						whileHover={{ scale: 1.03 }}
					>
						<Card className="p-4 flex flex-col h-full items-center justify-center gap-2">
							<m.div
								className={`p-2 rounded-full ${stat.bgClass}`}
								initial={{ scale: 0.95, opacity: 0 }}
								animate={{ scale: 1, opacity: 1 }}
								whileHover={{ scale: 1.1 }}
								transition={{
									delay: index * 0.1 + 0.2,
									type: "spring",
									stiffness: 200,
								}}
							>
								<stat.icon className={`w-5 h-5 ${stat.colorClass}`} />
							</m.div>
							<div className="text-center">
								<p className="text-2xl font-bold tabular-nums">
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
