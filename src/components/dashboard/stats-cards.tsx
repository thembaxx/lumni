"use client";

"use client";

import { IconFlame, IconTarget, IconTrendingUp } from "@tabler/icons-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";

interface StatsCardsProps {
	streak: number;
	questionsAnswered: number;
	accuracy: number;
}

function AnimatedNumber({
	value,
	suffix = "",
}: {
	value: number;
	suffix?: string;
}) {
	const [displayValue, setDisplayValue] = useState(0);

	useEffect(() => {
		const duration = 800;
		const steps = 30;
		const stepDuration = duration / steps;
		let currentStep = 0;

		const interval = setInterval(() => {
			currentStep++;
			const progress = currentStep / steps;
			const easeOut = 1 - Math.pow(1 - progress, 3);
			setDisplayValue(Math.round(value * easeOut));

			if (currentStep >= steps) {
				setDisplayValue(value);
				clearInterval(interval);
			}
		}, stepDuration);

		return () => clearInterval(interval);
	}, [value]);

	return (
		<span>
			{displayValue}
			{suffix && (
				<span className="text-xs text-muted-foreground ml-1">{suffix}</span>
			)}
		</span>
	);
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
			unit: streak === 1 ? "day" : "days",
			icon: IconFlame,
			color: "text-orange-500",
			bg: "bg-orange-500/10",
			suffix: null,
		},
		{
			label: "Questions",
			value: questionsAnswered,
			unit: "answered",
			icon: IconTarget,
			color: "text-blue-500",
			bg: "bg-blue-500/10",
			suffix: null,
		},
		{
			label: "Accuracy",
			value: accuracy,
			unit: "%",
			icon: IconTrendingUp,
			color: "text-green-500",
			bg: "bg-green-500/10",
			suffix: "%",
		},
	];

	return (
		<div className="grid grid-cols-3 gap-3">
			{stats.map((stat, index) => (
				<motion.div
					key={stat.label}
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: index * 0.1, duration: 0.4 }}
				>
					<Card className="p-4 flex flex-col h-full items-center justify-center gap-2">
						<motion.div
							className={`p-2 rounded-full ${stat.bg}`}
							initial={{ scale: 0 }}
							animate={{ scale: 1 }}
							transition={{
								delay: index * 0.1 + 0.2,
								type: "spring",
								stiffness: 200,
							}}
						>
							<stat.icon className={`w-5 h-5 ${stat.color}`} />
						</motion.div>
						<div className="text-center">
							<p className="text-2xl font-bold">
								<AnimatedNumber value={stat.value} />
							</p>
							<p className="text-xs text-muted-foreground line-clamp-2">
								{stat.label}
							</p>
						</div>
					</Card>
				</motion.div>
			))}
		</div>
	);
}
