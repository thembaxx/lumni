"use client";

import { m, useReducedMotion } from "framer-motion";
import { useEffect, useReducer, useRef, useSyncExternalStore } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppwriteSession } from "@/hooks/use-appwrite-session";
import { cn } from "@/lib/utils";
import { iOSEase } from "@/lib/utils/animation";
import {
	getDaysUntil,
	getMessage,
	getMilestone,
	getPhase,
	getTimeOfDay,
	getYearProgress,
	greetingMap,
	type Phase,
	phaseConfigs,
} from "@/lib/utils/countdown-helpers";

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
	const phase: Phase = mounted ? getPhase(daysLeft) : "grind";
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
										repeat: 2,
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
						<h1 className="balance text-wrap font-heading font-semibold text-2xl text-foreground leading-tight tracking-tight sm:text-3xl">
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

						<progress
							className="mt-3 mb-3 h-1.5 w-full overflow-hidden rounded-full bg-border/40 [&::-moz-progress-bar]:bg-primary [&::-webkit-progress-bar]:bg-transparent [&::-webkit-progress-value]:bg-primary"
							value={mounted ? Math.round(yearProgress * 100) : 0}
							max={100}
							aria-label="Year progress: days studied vs total"
						>
							<m.div
								variants={barGlowVariants}
								initial="hidden"
								animate="visible"
								className={cn("h-full rounded-full shadow-sm", cfg.barLight)}
							/>
						</progress>

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
