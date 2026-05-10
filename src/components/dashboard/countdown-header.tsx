"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { useAppwriteSession } from "@/hooks/use-appwrite-session";
import { cn } from "@/lib/utils";

const NSC_FINAL_DATE = new Date("2026-10-12");
const NSC_YEAR_START = new Date("2026-01-14");

type TimeOfDay = "morning" | "afternoon" | "evening";
type Phase = "foundation" | "grind" | "intensify" | "final";

function getTimeOfDay(): TimeOfDay {
	const hour = new Date().getHours();
	if (hour >= 5 && hour < 12) return "morning";
	if (hour >= 12 && hour < 18) return "afternoon";
	return "evening";
}

function getDaysUntil(): number {
	const now = new Date();
	now.setHours(0, 0, 0, 0);
	const target = new Date(NSC_FINAL_DATE);
	target.setHours(0, 0, 0, 0);
	const diff = target.getTime() - now.getTime();
	return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function getYearProgress(): number {
	const now = new Date();
	const start = NSC_YEAR_START.getTime();
	const end = NSC_FINAL_DATE.getTime();
	const elapsed = now.getTime() - start;
	return Math.min(1, Math.max(0, elapsed / (end - start)));
}

const greetingMap: Record<TimeOfDay, string> = {
	morning: "Good morning",
	afternoon: "Good afternoon",
	evening: "Good evening",
};

const phaseConfigs: Record<
	Phase,
	{
		glowClass: string;
		glow2Class: string;
		barLight: string;
	}
> = {
	foundation: {
		glowClass: "bg-[oklch(62%_0.19_55/8%)] dark:bg-[oklch(72%_0.16_45/12%)]",
		glow2Class:
			"bg-[oklch(72%_0.14_165/10%)] dark:bg-[oklch(28%_0.045_165/15%)]",
		barLight: "from-[oklch(62%_0.19_55)] to-[oklch(72%_0.14_165)]",
	},
	grind: {
		glowClass: "bg-[oklch(62%_0.19_55/10%)] dark:bg-[oklch(72%_0.16_45/15%)]",
		glow2Class:
			"bg-[oklch(72%_0.14_165/12%)] dark:bg-[oklch(28%_0.045_165/18%)]",
		barLight: "from-[oklch(62%_0.19_55)] to-[oklch(72%_0.14_165)]",
	},
	intensify: {
		glowClass: "bg-[oklch(78%_0.12_55/12%)] dark:bg-[oklch(80%_0.11_55/15%)]",
		glow2Class: "bg-[oklch(62%_0.19_55/15%)] dark:bg-[oklch(72%_0.16_45/18%)]",
		barLight: "from-[oklch(78%_0.12_55)] to-[oklch(62%_0.19_55)]",
	},
	final: {
		glowClass: "bg-[oklch(58%_0.16_25/15%)] dark:bg-[oklch(62%_0.16_25/18%)]",
		glow2Class: "bg-[oklch(78%_0.12_55/18%)] dark:bg-[oklch(80%_0.11_55/20%)]",
		barLight: "from-[oklch(58%_0.16_25)] to-[oklch(78%_0.12_55)]",
	},
};

function getPhase(daysLeft: number): Phase {
	if (daysLeft > 90) return "foundation";
	if (daysLeft > 60) return "grind";
	if (daysLeft > 30) return "intensify";
	return "final";
}

function getMessage(
	daysLeft: number,
	firstName: string | null,
): { primary: string; subtitle: string } {
	const name = firstName ?? "keep pushing";
	if (daysLeft > 90)
		return {
			primary: `Build your foundation, ${name}`,
			subtitle: "The long game starts now. Steady effort every day.",
		};
	if (daysLeft > 60)
		return {
			primary: `Keep pushing, ${name}`,
			subtitle: "You're building momentum. Every session counts.",
		};
	if (daysLeft > 30)
		return {
			primary: `The grind is real, ${name}`,
			subtitle: "Intensify your prep. Focus on weak areas.",
		};
	if (daysLeft > 14)
		return {
			primary: `Final stretch, ${name}`,
			subtitle: "Almost there. Stay focused, stay consistent.",
		};
	if (daysLeft > 7)
		return {
			primary: `${name} \u2014 this is it`,
			subtitle: "Last week before the NSC. You've got this.",
		};
	return {
		primary: `${name} \u2014 believe`,
		subtitle: "Trust your preparation. You've earned this.",
	};
}

type Milestone = { days: number; label: string; emoji: string } | null;

function getMilestone(daysLeft: number): Milestone {
	if (daysLeft === 30)
		return { days: 30, label: "One month left", emoji: "30" };
	if (daysLeft === 14)
		return { days: 14, label: "Two weeks to go", emoji: "14" };
	if (daysLeft === 7) return { days: 7, label: "One week to go", emoji: "7" };
	if (daysLeft === 90)
		return { days: 90, label: "90 days remaining", emoji: "90" };
	return null;
}

const easeOutQuart = [0.16, 1, 0.3, 1] as const;
const easeOutQuint = [0.22, 1, 0.36, 1] as const;

export function CountdownHeader() {
	const { name, isLoggedIn, isLoading } = useAppwriteSession();
	const [timeOfDay] = useState<TimeOfDay>(getTimeOfDay);
	const [daysLeft, setDaysLeft] = useState(() => getDaysUntil());
	const [yearProgress, setYearProgress] = useState(() => getYearProgress());
	const [mounted, setMounted] = useState(false);
	const shouldReduceMotion = useReducedMotion();

	const greeting = greetingMap[timeOfDay];
	const firstName = isLoggedIn && name ? name.split(" ")[0] : null;
	const phase = mounted ? getPhase(daysLeft) : "grind";
	const msg = mounted
		? getMessage(daysLeft, firstName)
		: { primary: "", subtitle: "" };
	const cfg = phaseConfigs[phase];
	const milestone = mounted ? getMilestone(daysLeft) : null;

	useEffect(() => {
		setMounted(true);
		function tick() {
			setDaysLeft(getDaysUntil());
			setYearProgress(getYearProgress());
		}
		tick();

		const midnight = new Date();
		midnight.setDate(midnight.getDate() + 1);
		midnight.setHours(0, 0, 0, 0);
		const msUntilMidnight = midnight.getTime() - Date.now();
		const timeout = setTimeout(() => {
			tick();
			const interval = setInterval(tick, 1000 * 60 * 60 * 24);
			return () => clearInterval(interval);
		}, msUntilMidnight);
		return () => clearTimeout(timeout);
	}, []);

	const headerVariants = {
		hidden: { opacity: 0, y: -8 },
		visible: {
			opacity: 1,
			y: 0,
			transition: {
				duration: shouldReduceMotion ? 0 : 0.4,
				ease: easeOutQuint,
			},
		},
	};

	const numberVariants = {
		hidden: { scale: 0.88, opacity: 0 },
		visible: {
			scale: 1,
			opacity: 1,
			transition: {
				duration: shouldReduceMotion ? 0 : 0.5,
				ease: easeOutQuart,
				delay: shouldReduceMotion ? 0 : 0.15,
			},
		},
	};

	const barGlowVariants = {
		hidden: { opacity: 0, scaleX: 0 },
		visible: {
			opacity: 1,
			scaleX: 1,
			transition: {
				duration: shouldReduceMotion ? 0 : 0.6,
				ease: easeOutQuint,
				delay: shouldReduceMotion ? 0 : 0.35,
			},
		},
	};

	return (
		<motion.div
			variants={headerVariants}
			initial="hidden"
			animate="visible"
			className="mx-4 mb-4"
		>
			<div className="relative overflow-hidden rounded-2xl bg-secondary/60 dark:bg-secondary/20 px-5 py-5 sm:px-6 sm:py-6">
				{milestone && (
					<motion.div
						initial={{ opacity: 0, y: -8, scale: 0.9 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						transition={{
							duration: shouldReduceMotion ? 0 : 0.4,
							ease: easeOutQuint,
						}}
						className="absolute -top-px left-4 right-4 flex items-center justify-center"
					>
						<div className="inline-flex items-center gap-1.5 rounded-b-xl bg-warning/20 dark:bg-warning/10 border border-warning/30 dark:border-warning/20 px-3 py-1">
							<motion.span
								animate={
									shouldReduceMotion
										? {}
										: { scale: [1, 1.15, 1], rotate: [0, 8, -8, 0] }
								}
								transition={{
									duration: 1,
									repeat: Infinity,
									ease: easeOutQuint,
								}}
								className="text-sm"
							>
								{milestone.emoji}
							</motion.span>
							<span className="text-xs font-semibold text-warning">
								{milestone.label}
							</span>
						</div>
					</motion.div>
				)}

				<div className="relative z-10">
					<h1 className="font-geist text-xl sm:text-2xl font-bold text-foreground leading-tight tracking-tight text-wrap-balance">
						{greeting}
						{isLoggedIn && name ? (
							<span className="text-primary">, {firstName}</span>
						) : null}
					</h1>

					<div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
						{isLoading || !mounted ? (
							<div className="h-8 w-24 animate-pulse rounded-md bg-muted/40" />
						) : (
							<motion.span
								variants={numberVariants}
								initial="hidden"
								animate="visible"
								className={cn(
									"inline-block text-3xl sm:text-4xl font-bold tracking-tight tabular-nums",
									cfg.barLight,
								)}
								aria-live="polite"
							>
								{daysLeft}
							</motion.span>
						)}
						{!isLoading && mounted && (
							<span className="text-base sm:text-lg font-medium text-muted-foreground">
								{daysLeft === 1 ? "day" : "days"} until the NSC Finals
							</span>
						)}
					</div>

					<div
						className="mt-3 mb-1 h-1 w-full overflow-hidden rounded-full bg-border/40"
						role="progressbar"
						aria-valuenow={Math.round(yearProgress * 100)}
						aria-valuemin={0}
						aria-valuemax={100}
						aria-label="Year progress: days studied vs total"
					>
						<motion.div
							variants={barGlowVariants}
							initial="hidden"
							animate="visible"
							className={cn("h-full rounded-full", cfg.barLight)}
						/>
					</div>

					{mounted && (
						<motion.p
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{
								duration: shouldReduceMotion ? 0 : 0.3,
								delay: shouldReduceMotion ? 0 : 0.5,
							}}
							className="mt-1 text-xs text-muted-foreground leading-snug"
						>
							<span className="font-semibold text-foreground/80">
								{msg.primary}
							</span>
							<span className="mx-1 opacity-50">\u2014</span>
							{msg.subtitle}
						</motion.p>
					)}
				</div>

				<motion.div
					initial={{ opacity: 0, scale: 0.5 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{
						duration: shouldReduceMotion ? 0 : 0.8,
						ease: easeOutQuint,
						delay: shouldReduceMotion ? 0 : 0.2,
					}}
					className={cn(
						"pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full blur-2xl",
						cfg.glowClass,
					)}
					aria-hidden="true"
				/>
				<div
					className={cn(
						"pointer-events-none absolute -bottom-4 -right-4 h-20 w-20 rounded-full blur-xl",
						cfg.glow2Class,
					)}
					aria-hidden="true"
				/>
			</div>
		</motion.div>
	);
}
