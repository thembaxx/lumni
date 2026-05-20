"use client";

import {
	ArrowRight01Icon,
	Cancel01Icon,
	CheckmarkCircle01Icon,
	PlayFreeIcons,
	Settings01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, m, useReducedMotion } from "framer-motion";
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
	const { push } = useRouter();
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
			if (href) push(href);
		},
		[steps, push],
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
				<m.div
					key="card"
					initial={shouldReduceMotion ? {} : { opacity: 0, y: 8 }}
					animate={{ opacity: 1, y: 0 }}
					exit={shouldReduceMotion ? {} : { opacity: 0, y: -8, scale: 0.97 }}
					transition={{ duration: 0.25, ease: iOSEase }}
				>
					<Card className="overflow-hidden border border-system-accent/20 bg-system-accent/3">
						<div className="p-5">
							<div className="mb-4 flex items-start justify-between">
								<div>
									<h2 className="text-balance font-semibold text-lg tracking-tight">
										Getting started
									</h2>
									<p className="mt-0.5 text-muted-foreground text-sm">
										Complete these steps to make the most of Lumni.
									</p>
								</div>
								<button
									type="button"
									onClick={handleDismiss}
									className="-mr-1 rounded-md p-2 transition-colors hover:bg-muted/50"
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
										<m.div
											key={item.key}
											whileTap={done ? {} : { scale: 0.96 }}
											transition={{ type: "spring", duration: 0.3, bounce: 0 }}
											className={`flex items-center gap-3 rounded-xl p-3 transition-colors ${
												done ? "opacity-50" : "cursor-pointer hover:bg-muted/20"
											}`}
											onClick={
												done ? undefined : () => markDone(item.key, item.href)
											}
										>
											<div
												className={`flex size-8 items-center justify-center rounded-full ${
													done
														? "bg-success/20 text-success"
														: "bg-system-accent/10 text-system-accent"
												}`}
											>
												<div className="relative size-4">
													<AnimatePresence mode="wait">
														{done ? (
															<m.div
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
															</m.div>
														) : (
															<m.div
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
															</m.div>
														)}
													</AnimatePresence>
												</div>
											</div>
											<div className="min-w-0 flex-1">
												<p
													className={`font-semibold text-sm ${
														done ? "line-through" : ""
													}`}
												>
													{item.label}
												</p>
												<p className="truncate text-pretty text-muted-foreground text-xs">
													{item.desc}
												</p>
											</div>
											{!done && (
												<Button
													size="sm"
													variant="outline"
													className="h-8 shrink-0 px-3 text-xs"
													onClick={() => markDone(item.key, item.href)}
												>
													{item.action}
												</Button>
											)}
										</m.div>
									);
								})}
							</div>
						</div>
					</Card>
				</m.div>
			)}
		</AnimatePresence>
	);
}
