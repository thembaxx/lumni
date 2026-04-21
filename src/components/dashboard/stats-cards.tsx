"use client";

import { IconFlame, IconTarget, IconTrendingUp } from "@tabler/icons-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";

interface StatsCardsProps {
	streak: number;
	questionsAnswered: number;
	accuracy: number;
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
		},
		{
			label: "Questions",
			value: questionsAnswered,
			unit: "answered",
			icon: IconTarget,
			color: "text-blue-500",
			bg: "bg-blue-500/10",
		},
		{
			label: "Accuracy",
			value: accuracy,
			unit: "%",
			icon: IconTrendingUp,
			color: "text-green-500",
			bg: "bg-green-500/10",
		},
	];

	return (
		<div className="grid grid-cols-3 gap-3">
			{stats.map((stat, index) => (
				<motion.div
					key={stat.label}
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: index * 0.1 }}
				>
					<Card className="p-4 flex flex-col h-full items-center justify-center gap-2">
						<div className={`p-2 rounded-full ${stat.bg}`}>
							<stat.icon className={`w-5 h-5 ${stat.color}`} />
						</div>
						<div className="text-center">
							<p className="text-2xl font-bold">
								{stat.value}
								{stat.unit !== "answered" && stat.unit !== "%" && (
									<span className="text-xs text-muted-foreground ml-1">
										{stat.unit}
									</span>
								)}
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
