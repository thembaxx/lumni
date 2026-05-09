"use client";

import { m } from "framer-motion";
import { LucideIcon, TrendingDown, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type StatCardVariant = "default" | "admin" | "dashboard";

interface StatCardProps {
	icon?: LucideIcon;
	label: string;
	value: string | number;
	trend?: "up" | "down" | "neutral";
	colorClass?: string;
	bgClass?: string;
	variant?: StatCardVariant;
	className?: string;
	delay?: number;
}

const trendColors = {
	up: "text-green-500",
	down: "text-red-500",
	neutral: "text-muted-foreground",
};

export function StatCard({
	icon: Icon,
	label,
	value,
	trend,
	colorClass = "text-primary",
	bgClass = "bg-primary/10",
	variant = "default",
	className,
	delay = 0,
}: StatCardProps) {
	const trendColor = trend ? trendColors[trend] : undefined;

	if (variant === "admin") {
		return (
			<m.div
				initial={{ opacity: 0, scale: 0.95 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ delay, duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
				className={cn("p-3 rounded-lg bg-muted/50", className)}
			>
				<p className="text-xs text-muted-foreground">{label}</p>
				<m.p
					className="text-xl font-semibold tabular-nums"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: delay + 0.15 }}
				>
					{value}
				</m.p>
			</m.div>
		);
	}

	if (variant === "dashboard") {
		return (
			<m.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay, duration: 0.4 }}
				whileHover={{ scale: 1.03 }}
			>
				<Card
					className={cn(
						"p-4 flex flex-col items-center justify-center gap-2",
						className,
					)}
				>
					{m.div(
						(className) =>
							className && (
								<div className={cn("p-2 rounded-full", bgClass, className)}>
									{Icon && <Icon className={cn("h-5 w-5", colorClass)} />}
								</div>
							),
						{
							initial: { scale: 0.95, opacity: 0 },
							animate: { scale: 1, opacity: 1 },
							whileHover: { scale: 1.1 },
							transition: {
								delay: delay + 0.2,
								type: "spring",
								stiffness: 300,
								damping: 25,
							},
						},
					)}
					<m.div
						className="text-center"
						initial={{ opacity: 0, y: 5 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: delay + 0.3 }}
					>
						<span className="text-xs text-muted-foreground">{label}</span>
					</m.div>
					<m.span
						className={cn("text-xl font-bold tabular-nums", colorClass)}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: delay + 0.35 }}
					>
						{value}
					</m.span>
				</Card>
			</m.div>
		);
	}

	return (
		<Card className={cn(className)}>
			<CardContent className="p-4">
				<div className="flex items-center gap-2 text-muted-foreground mb-2">
					{Icon && <Icon className="h-4 w-4" />}
					<span className="text-xs">{label}</span>
				</div>
				<div
					className={cn(
						"text-2xl font-bold flex items-center gap-2",
						trendColor,
					)}
				>
					{value}
					{trend === "up" && <TrendingUp className="h-4 w-4" />}
					{trend === "down" && <TrendingDown className="h-4 w-4" />}
				</div>
			</CardContent>
		</Card>
	);
}
