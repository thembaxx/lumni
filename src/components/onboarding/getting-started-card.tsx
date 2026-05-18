"use client";

import {
	ArrowRight01Icon,
	Cancel01Icon,
	CheckmarkCircle01Icon,
	PlayFreeIcons,
	Settings01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { FIRST_VISITS_KEY } from "@/components/onboarding/onboarding-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { iOSEase } from "@/lib/utils/animation";

const STEPS_KEY = "lumni_getting_started_steps";

interface StepState {
	quiz: boolean;
	settings: boolean;
	explore: boolean;
}

const defaultSteps: StepState = {
	quiz: false,
	settings: false,
	explore: false,
};

function loadSteps(): StepState {
	if (typeof window === "undefined") return defaultSteps;
	try {
		const raw = localStorage.getItem(STEPS_KEY);
		return raw ? { ...defaultSteps, ...JSON.parse(raw) } : defaultSteps;
	} catch {
		return defaultSteps;
	}
}

function saveSteps(steps: StepState) {
	localStorage.setItem(STEPS_KEY, JSON.stringify(steps));
}

export function GettingStartedCard() {
	const router = useRouter();
	const [dismissed, setDismissed] = useState(false);
	const [collapsing, setCollapsing] = useState(false);
	const [steps, setSteps] = useState<StepState>(defaultSteps);
	const [visitsLeft, setVisitsLeft] = useState(3);
	const shouldReduceMotion = useReducedMotion();

	useEffect(() => {
		setSteps(loadSteps());
		const raw = localStorage.getItem(FIRST_VISITS_KEY);
		if (raw) {
			const n = Number.parseInt(raw, 10);
			setVisitsLeft(Number.isNaN(n) ? 0 : n);
		}
	}, []);

	const allDone = steps.quiz && steps.settings && steps.explore;

	const handleDismiss = useCallback(() => {
		setCollapsing(true);
		setTimeout(() => {
			setDismissed(true);
			const current = Number.parseInt(
				localStorage.getItem(FIRST_VISITS_KEY) ?? "1",
				10,
			);
			localStorage.setItem(FIRST_VISITS_KEY, String(Math.max(0, current - 1)));
		}, 250);
	}, []);

	const markDone = useCallback(
		(key: keyof StepState, href?: string) => {
			const next = { ...steps, [key]: true };
			setSteps(next);
			saveSteps(next);
			if (href) router.push(href);
		},
		[steps, router],
	);

	if (dismissed || allDone || visitsLeft <= 0) return null;

	const actions = [
		{
			key: "quiz" as const,
			icon: PlayFreeIcons,
			label: "Take your first quiz",
			desc: "Practice with AI-generated questions tailored to your subjects.",
			action: "Start quiz",
			href: "/quiz",
		},
		{
			key: "settings" as const,
			icon: Settings01Icon,
			label: "Set study preferences",
			desc: "Adjust your subjects, study time, and notification settings.",
			action: "Open settings",
			href: "/settings",
		},
		{
			key: "explore" as const,
			icon: ArrowRight01Icon,
			label: "Explore past papers",
			desc: "Practice with real Matric exam papers from previous years.",
			action: "Browse papers",
			href: "/past-papers",
		},
	];

	return (
		<AnimatePresence>
			{!collapsing && (
				<motion.div
					key="card"
					initial={shouldReduceMotion ? {} : { opacity: 0, y: 8 }}
					animate={{ opacity: 1, y: 0 }}
					exit={shouldReduceMotion ? {} : { opacity: 0, y: -8, scale: 0.97 }}
					transition={{ duration: 0.25, ease: iOSEase }}
				>
					<Card className="border border-system-accent/20 bg-system-accent/3 overflow-hidden">
						<div className="p-5">
							<div className="flex items-start justify-between mb-4">
								<div>
									<h2 className="text-lg font-extrabold tracking-tight text-balance">
										Getting started
									</h2>
									<p className="text-sm text-muted-foreground mt-0.5">
										Complete these steps to make the most of Lumni.
									</p>
								</div>
								<button
									type="button"
									onClick={handleDismiss}
									className="-mr-1 p-2 rounded-md hover:bg-muted/50 transition-colors"
									aria-label="Dismiss"
								>
									<HugeiconsIcon
										icon={Cancel01Icon}
										className="size-4 text-muted-foreground"
									/>
								</button>
							</div>

							<div className="flex flex-col gap-2">
								{actions.map((item) => {
									const done = steps[item.key];
									return (
										<motion.div
											key={item.key}
											whileTap={done ? {} : { scale: 0.96 }}
											transition={{ type: "spring", duration: 0.3, bounce: 0 }}
											className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
												done ? "opacity-50" : "hover:bg-muted/20 cursor-pointer"
											}`}
											onClick={
												done ? undefined : () => markDone(item.key, item.href)
											}
										>
											<div
												className={`size-8 rounded-full flex items-center justify-center ${
													done
														? "bg-success/20 text-success"
														: "bg-system-accent/10 text-system-accent"
												}`}
											>
												<div className="relative size-4">
													<AnimatePresence mode="wait">
														{done ? (
															<motion.div
																key="check"
																initial={{
																	scale: 0.25,
																	opacity: 0,
																	filter: "blur(4px)",
																}}
																animate={{
																	scale: 1,
																	opacity: 1,
																	filter: "blur(0px)",
																}}
																exit={{
																	scale: 0.25,
																	opacity: 0,
																	filter: "blur(4px)",
																}}
																transition={{
																	type: "spring",
																	duration: 0.3,
																	bounce: 0,
																}}
																className="absolute inset-0"
															>
																<HugeiconsIcon
																	icon={CheckmarkCircle01Icon}
																	className="size-4"
																/>
															</motion.div>
														) : (
															<motion.div
																key="action"
																initial={{
																	scale: 0.25,
																	opacity: 0,
																	filter: "blur(4px)",
																}}
																animate={{
																	scale: 1,
																	opacity: 1,
																	filter: "blur(0px)",
																}}
																exit={{
																	scale: 0.25,
																	opacity: 0,
																	filter: "blur(4px)",
																}}
																transition={{
																	type: "spring",
																	duration: 0.3,
																	bounce: 0,
																}}
																className="absolute inset-0"
															>
																<HugeiconsIcon
																	icon={item.icon}
																	className="size-4"
																/>
															</motion.div>
														)}
													</AnimatePresence>
												</div>
											</div>
											<div className="flex-1 min-w-0">
												<p
													className={`text-sm font-semibold ${
														done ? "line-through" : ""
													}`}
												>
													{item.label}
												</p>
												<p className="text-xs text-muted-foreground truncate text-pretty">
													{item.desc}
												</p>
											</div>
											{!done && (
												<Button
													size="sm"
													variant="outline"
													className="shrink-0 text-xs h-8 px-3"
													onClick={() => markDone(item.key, item.href)}
												>
													{item.action}
												</Button>
											)}
										</motion.div>
									);
								})}
							</div>
						</div>
					</Card>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
