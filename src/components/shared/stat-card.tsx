"use client";

import { ChartDownIcon, ChartUpIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { m } from "framer-motion";
import { cn } from "@/lib/shared";
import { iOSEase } from "@/lib/utils/animation";

export type StatCardVariant = "default" | "admin" | "dashboard";

interface StatCardProps {
	icon?: React.ComponentType<{ className?: string }>;
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
	up: "text-success",
	down: "text-destructive",
	neutral: "text-muted-foreground",
};

export function StatCard({
	icon: Icon,
	label,
	value,
	trend,
	colorClass = "text-foreground",
	bgClass = "bg-[--system-accent]/10",
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
				transition={{ delay, duration: 0.3, ease: iOSEase }}
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
				<div
					className={cn(
						"p-4 flex flex-col items-center justify-center gap-2 overflow-hidden rounded-[2.5rem] border border-border/80 bg-card shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] transition-colors",
						className,
					)}
				>
					<m.div
						className={cn("p-2 rounded-full", bgClass)}
						initial={{ scale: 0.95, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						whileHover={{ scale: 1.1 }}
						transition={{
							delay: delay + 0.2,
							type: "spring",
							stiffness: 300,
							damping: 25,
						}}
					>
						{Icon && <Icon className={cn("size-5", colorClass)} />}
					</m.div>
					<m.div
						className="text-center"
						initial={{ opacity: 0, y: 5 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: delay + 0.3 }}
					>
						<span className="text-xs text-muted-foreground">{label}</span>
					</m.div>
					<m.span
						className={cn("text-xl font-extrabold tabular-nums", colorClass)}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: delay + 0.35 }}
					>
						{value}
					</m.span>
				</div>
			</m.div>
		);
	}

	return (
		<div
			className={cn(
				"overflow-hidden rounded-[2.5rem] border border-border/80 bg-card shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] transition-colors",
				className,
			)}
		>
			<div className="p-4">
				<div className="flex items-center gap-2 text-muted-foreground mb-2">
					{Icon && <Icon className="size-4" />}
					<span className="text-xs">{label}</span>
				</div>
				<div
					className={cn(
						"text-2xl font-extrabold flex items-center gap-2 tabular-nums",
						trendColor,
					)}
				>
					{value}
					{trend === "up" && (
						<HugeiconsIcon icon={ChartUpIcon} className="size-4" />
					)}
					{trend === "down" && (
						<HugeiconsIcon icon={ChartDownIcon} className="size-4" />
					)}
				</div>
			</div>
		</div>
	);
}
