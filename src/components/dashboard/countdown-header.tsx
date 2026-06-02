"use client";

import { m, useReducedMotion } from "framer-motion";
import { useEffect, useReducer, useRef, useSyncExternalStore } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppwriteSession } from "@/hooks/use-appwrite-session";
import { cn } from "@/lib/shared";
import { iOSEase } from "@/lib/utils/animation";

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
		glowClass: "bg-system-accent/10",
		glow2Class: "bg-system-accent/5",
		barLight: "bg-system-accent",
	},
	grind: {
		glowClass: "bg-system-accent/15",
		glow2Class: "bg-system-accent/8",
		barLight: "bg-system-accent",
	},
	intensify: {
		glowClass: "bg-warning/15",
		glow2Class: "bg-system-accent/15",
		barLight: "bg-warning",
	},
	final: {
		glowClass: "bg-destructive/15",
		glow2Class: "bg-warning/15",
		barLight: "bg-destructive",
	},
};

function getPhase(daysLeft: number): Phase {
	if (daysLeft > 90) return "foundation";
	if (daysLeft > 60) return "grind";
	if (daysLeft > 30) return "intensify";
	return "final";
}

const encouragements = [
	"Small steps every day build unstoppable momentum.",
	"Your brain learns best in focused 25-minute bursts.",
	"Reviewing past papers is the fastest path to confidence.",
	"Sleep is when your brain consolidates memory. Don't skip it.",
	"Teaching a concept to someone else locks it in your mind.",
	"The Pomodoro technique: 25 min study, 5 min break. Try it.",
	"Active recall beats re-reading. Quiz yourself, don't just read.",
	"Mix up your subjects to keep your brain engaged.",
	"Explain it out loud. If you can say it, you know it.",
	"Your mistakes are just data. Review them, learn, move on.",
];

function todaysSeed(): number {
	const date = new Date();
	return (
		date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate()
	);
}

function pickEncouragement(): string {
	const seed = todaysSeed();
	return encouragements[seed % encouragements.length];
}

function getMessage(
	daysLeft: number,
	firstName: string | null,
): { primary: string; subtitle: string } {
	const name = firstName ?? "keep pushing";
	const tip = pickEncouragement();
	if (daysLeft > 90)
		return {
			primary: `Build your foundation, ${name}`,
			subtitle: tip,
		};
	if (daysLeft > 60)
		return {
			primary: `Keep pushing, ${name}`,
			subtitle: tip,
		};
	if (daysLeft > 30)
		return {
			primary: `The grind is real, ${name}`,
			subtitle: tip,
		};
	if (daysLeft > 14)
		return {
			primary: `Final stretch, ${name}`,
			subtitle: tip,
		};
	if (daysLeft > 7)
		return {
			primary: `${name}, this is it`,
			subtitle: tip,
		};
	return {
		primary: `${name}, believe`,
		subtitle: tip,
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

type CountdownState = {
	mounted: boolean;
	daysLeft: number;
	yearProgress: number;
};

type CountdownAction = { type: "MOUNT" } | { type: "TICK" };

function countdownReducer(
	state: CountdownState,
	action: CountdownAction,
): CountdownState {
	switch (action.type) {
		case "MOUNT":
			return {
				mounted: true,
				daysLeft: getDaysUntil(),
				yearProgress: getYearProgress(),
			};
		case "TICK":
			return {
				...state,
				daysLeft: getDaysUntil(),
				yearProgress: getYearProgress(),
			};
	}
}

export function CountdownHeader() {
	const {
		user: { name },
		isLoggedIn,
		isLoading: _sessionLoading,
	} = useAppwriteSession();
	const [cdState, dispatchCd] = useReducer(countdownReducer, {
		mounted: false,
		daysLeft: 0,
		yearProgress: 0,
	});
	const { mounted, daysLeft, yearProgress } = cdState;
	const sentinelRef = useRef<HTMLDivElement>(null);
	const isCompactRef = useRef(false);
	const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
	const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);
	const shouldReduceMotion = useReducedMotion();

	const greeting = mounted ? greetingMap[getTimeOfDay()] : "Good";
	const firstName = isLoggedIn && name ? name.split(" ")[0] : null;
	const phase = mounted ? getPhase(daysLeft) : "grind";
	const msg = mounted
		? getMessage(daysLeft, firstName)
		: { primary: "", subtitle: "" };
	const cfg = phaseConfigs[phase];
	const milestone = mounted ? getMilestone(daysLeft) : null;

	const isCompact = useSyncExternalStore(
		(onStoreChange) => {
			const el = sentinelRef.current;
			if (!el) return () => {};
			const container = el.closest("[data-scroll-container]") ?? null;
			const observer = new IntersectionObserver(
				([entry]) => {
					isCompactRef.current = entry.boundingClientRect.top < 0;
					onStoreChange();
				},
				{
					root: container,
					rootMargin: "-1px 0px 0px 0px",
					threshold: 0,
				},
			);
			observer.observe(el);
			return () => observer.disconnect();
		},
		() => isCompactRef.current,
		() => false,
	);

	useEffect(() => {
		dispatchCd({ type: "MOUNT" });

		const midnight = new Date();
		midnight.setDate(midnight.getDate() + 1);
		midnight.setHours(0, 0, 0, 0);
		const msUntilMidnight = midnight.getTime() - Date.now();
		timeoutRef.current = setTimeout(() => {
			dispatchCd({ type: "TICK" });
			intervalRef.current = setInterval(
				() => dispatchCd({ type: "TICK" }),
				1000 * 60 * 60 * 24,
			);
		}, msUntilMidnight);
		return () => {
			clearTimeout(timeoutRef.current);
			clearInterval(intervalRef.current);
		};
	}, []);

	const headerVariants = {
		hidden: { opacity: 0, y: -8 },
		visible: {
			opacity: 1,
			y: 0,
			transition: {
				duration: shouldReduceMotion ? 0 : 0.25,
				ease: iOSEase,
			},
		},
	};

	const numberVariants = {
		hidden: { scale: 0.88, opacity: 0 },
		visible: {
			scale: 1,
			opacity: 1,
			transition: {
				duration: shouldReduceMotion ? 0 : 0.35,
				ease: iOSEase,
				delay: shouldReduceMotion ? 0 : 0.1,
			},
		},
	};

	const barGlowVariants = {
		hidden: { opacity: 0, scaleX: 0 },
		visible: {
			opacity: 1,
			scaleX: 1,
			transition: {
				duration: shouldReduceMotion ? 0 : 0.4,
				ease: iOSEase,
				delay: shouldReduceMotion ? 0 : 0.15,
			},
		},
	};

	return (
		<>
			<div ref={sentinelRef} className="pointer-events-none h-px" aria-hidden />

			<m.div
				variants={headerVariants}
				initial="hidden"
				animate="visible"
				className="w-full"
			>
				<div className="relative overflow-hidden rounded-lg bg-secondary/60 px-5 py-5 sm:px-6 sm:py-6">
					{milestone && (
						<m.div
							initial={{ opacity: 0, y: -8, scale: 0.9 }}
							animate={{ opacity: 1, y: 0, scale: 1 }}
							transition={{
								duration: shouldReduceMotion ? 0 : 0.4,
								ease: iOSEase,
							}}
							className="absolute -top-px right-4 left-4 flex items-center justify-center"
						>
							<div className="inline-flex items-center gap-1.5 rounded-b-xl border border-warning/30 bg-warning/20 px-3 py-1">
								<m.span
									animate={
										shouldReduceMotion
											? {}
											: { scale: [1, 1.15, 1], rotate: [0, 8, -8, 0] }
									}
									transition={{
										duration: 1,
										repeat: Infinity,
										ease: iOSEase,
									}}
									className="text-sm"
								>
									{milestone.emoji}
								</m.span>
								<span className="font-extrabold text-warning text-xs uppercase tracking-tight">
									{milestone.label}
								</span>
							</div>
						</m.div>
					)}

					<div className="relative z-elevated">
						<h1 className="balance text-wrap font-semibold text-foreground text-xl leading-tight tracking-tight sm:text-2xl">
							{greeting}
							{isLoggedIn && name ? (
								<span className="text-system-accent">, {firstName}</span>
							) : null}
						</h1>

						<div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
							{_sessionLoading || !mounted ? (
								<Skeleton className="h-8 w-24 rounded-md" />
							) : (
								<m.span
									variants={numberVariants}
									initial="hidden"
									animate="visible"
									className={cn(
										"inline-block font-extrabold font-mono text-4xl text-system-accent tabular-nums tracking-tighter md:text-5xl",
									)}
									aria-live="polite"
								>
									{daysLeft}
								</m.span>
							)}
							{!_sessionLoading && mounted && (
								<div>
									<p className="font-medium text-muted-foreground text-xs tabular-nums">
										{daysLeft === 1 ? "day" : "days"}
									</p>
									<p className="font-extrabold text-muted-foreground text-xs tabular-nums">
										until finals
									</p>
								</div>
							)}
						</div>

						<div
							className="mt-3 mb-3 h-1.5 w-full overflow-hidden rounded-full bg-border/40"
							role="progressbar"
							aria-valuenow={mounted ? Math.round(yearProgress * 100) : 0}
							aria-valuemin={0}
							aria-valuemax={100}
							aria-label="Year progress: days studied vs total"
						>
							<m.div
								variants={barGlowVariants}
								initial="hidden"
								animate="visible"
								className={cn("h-full rounded-full shadow-sm", cfg.barLight)}
							/>
						</div>

						{mounted && (
							<m.p
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{
									duration: shouldReduceMotion ? 0 : 0.3,
									delay: shouldReduceMotion ? 0 : 0.5,
								}}
								className="mt-1 text-pretty font-medium text-muted-foreground text-xs leading-snug"
							>
								<span className="font-extrabold text-foreground/80">
									{msg.primary}
								</span>
								. {msg.subtitle}
							</m.p>
						)}
					</div>

					<m.div
						initial={{ opacity: 0, scale: 0.5 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{
							duration: shouldReduceMotion ? 0 : 0.8,
							ease: iOSEase,
							delay: shouldReduceMotion ? 0 : 0.2,
						}}
						className={cn(
							"pointer-events-none absolute -top-6 -right-6 size-32 rounded-full blur-2xl",
							cfg.glowClass,
						)}
						aria-hidden="true"
					/>
					<div
						className={cn(
							"pointer-events-none absolute -right-4 -bottom-4 size-20 rounded-full blur-xl",
							cfg.glow2Class,
						)}
						aria-hidden="true"
					/>
				</div>
			</m.div>

			<m.div
				initial={false}
				animate={{
					opacity: isCompact ? 1 : 0,
					y: isCompact ? 0 : -4,
					pointerEvents: isCompact ? "auto" : ("none" as unknown as undefined),
				}}
				transition={{
					duration: shouldReduceMotion ? 0 : 0.2,
					ease: iOSEase,
				}}
				className="sticky top-0 z-sticky -mx-4 border-border/10 border-b bg-system-background/90 px-4 pt-2 pb-2"
				style={{ viewTransitionName: "countdown-compact" }}
			>
				<div className="mx-auto flex max-w-md items-center gap-3">
					<span className="font-extrabold text-foreground/70 text-xs">
						{greeting}
						{isLoggedIn && name ? `, ${firstName}` : ""}
					</span>
					<span className="ml-auto flex items-baseline gap-1">
						<span className="font-extrabold text-lg text-system-accent tabular-nums">
							{daysLeft}
						</span>
						<span className="font-medium text-muted-foreground text-xs">
							{daysLeft === 1 ? "day" : "days"}
						</span>
					</span>
					<div className="h-1 w-12 overflow-hidden rounded-full bg-border/30">
						<div
							className={cn(
								"h-full rounded-full transition-[width]",
								cfg.barLight,
							)}
							style={{ width: `${yearProgress * 100}%` }}
						/>
					</div>
				</div>
			</m.div>
		</>
	);
}
