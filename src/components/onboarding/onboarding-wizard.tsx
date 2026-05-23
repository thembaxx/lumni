"use client";

import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { Confetti } from "@/components/celebration/confetti";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { nscSubjects } from "@/data/nsc-subjects";
import { useOnboarding } from "@/hooks/use-onboarding";
import { iOSEase } from "@/lib/utils/animation";
import { PageContainer } from "@/components/layout/page-container";
import { GoalsSVG } from "./svgs/goals-svg";
import { SubjectsSVG } from "./svgs/subjects-svg";
import { WelcomeSVG } from "./svgs/welcome-svg";

const ParticleField = dynamic(
	() => import("./particle-field").then((m) => ({ default: m.ParticleField })),
	{ ssr: false },
);

interface OnboardingWizardProps {
	onComplete?: () => void;
}

const STEPS_COPY = [
	{
		title: "Pass your Matric with confidence",
		body: "Lumni tailors quizzes, flashcards, and past papers to your subjects. Get set up in 30 seconds.",
		cta: "Let's go",
		SVG: WelcomeSVG,
	},
	{
		title: "Pick your subjects",
		body: "Select the subjects you're taking this year so everything is relevant from day one.",
		cta: "Continue",
		SVG: SubjectsSVG,
	},
	{
		title: "Set your goals",
		body: "Your target APS and how much time you can study each day. We'll build a plan around it.",
		cta: "Continue",
		SVG: GoalsSVG,
	},
	{
		title: "You're all set",
		body: "Your preferences are saved. Ready to answer your first question?",
		cta: "Start learning",
		SVG: WelcomeSVG,
	},
];

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
	const { data, completeOnboarding, updateProgress } = useOnboarding();
	const [step, setStep] = useState(data.currentStep);
	const [selectedSubjects, setSelectedSubjects] = useState<string[]>(
		data.selectedSubjects,
	);
	const [targetAps, setTargetAps] = useState(data.targetAps);
	const [dailyMinutes, setDailyMinutes] = useState(data.dailyStudyMinutes);
	const [searchTerm, setSearchTerm] = useState("");
	const [showConfetti, setShowConfetti] = useState(false);
	const [isCompleting, setIsCompleting] = useState(false);
	const shouldReduceMotion = useReducedMotion();

	useEffect(() => {
		if (step !== 1) {
			setSearchTerm("");
		}
	}, [step]);

	useEffect(() => {
		updateProgress({
			currentStep: step,
			selectedSubjects,
			targetAps,
			dailyStudyMinutes: dailyMinutes,
		});
	}, [step, selectedSubjects, targetAps, dailyMinutes, updateProgress]);

	const current = STEPS_COPY[step];

	const filteredSubjects = nscSubjects.filter((subject) =>
		subject.name.toLowerCase().includes(searchTerm.toLowerCase()),
	);

	const canProceed = () => {
		switch (step) {
			case 0:
				return true;
			case 1:
				return selectedSubjects.length > 0;
			case 2:
				return targetAps >= 20 && targetAps <= 50 && dailyMinutes >= 10;
			case 3:
				return true;
			default:
				return true;
		}
	};

	const complete = useCallback(() => {
		if (isCompleting) return;
		setIsCompleting(true);
		setShowConfetti(true);
		completeOnboarding({
			selectedSubjects,
			targetAps,
			dailyStudyMinutes: dailyMinutes,
		});
		setTimeout(() => {
			onComplete?.();
		}, 800);
	}, [
		isCompleting,
		completeOnboarding,
		selectedSubjects,
		targetAps,
		dailyMinutes,
		onComplete,
	]);

	const handleNext = () => {
		if (step === STEPS_COPY.length - 1) {
			complete();
			return;
		}
		setStep((s) => s + 1);
	};

	const handleBack = () => {
		if (step > 0) {
			setStep((s) => s - 1);
		}
	};

	return (
		<div className="fixed inset-0 z-modal overflow-y-auto bg-system-grouped">
			{showConfetti && <Confetti trigger={showConfetti} />}
			<ParticleField step={step} />

			<PageContainer className="relative z-elevated min-h-full py-4 md:py-8">
				<div className="mb-8 flex items-center gap-2">
					{STEPS_COPY.map((_, i) => (
						<m.div
							key={STEPS_COPY[i].title}
							className={`h-1 flex-1 rounded-full ${
								i <= step ? "bg-[--system-accent]" : "bg-[--system-separator]"
							}`}
							animate={{
								backgroundColor:
									i <= step
										? "var(--system-accent)"
										: "var(--system-separator)",
							}}
							transition={{
								duration: 0.4,
								ease: iOSEase,
								delay: i <= step ? (step - i) * 0.04 : 0,
							}}
						/>
					))}
				</div>

				<AnimatePresence mode="wait" initial={false}>
					<m.div
						key={`step-${step}`}
						initial={shouldReduceMotion ? {} : { opacity: 0, y: 12 }}
						animate={{ opacity: 1, y: 0 }}
						exit={shouldReduceMotion ? {} : { opacity: 0, y: -8 }}
						transition={{ duration: 0.25, ease: iOSEase }}
						className="flex-1"
					>
						{step < 3 ? (
							<div className="grid grid-cols-12 items-center gap-6">
								<div className="col-span-12 md:col-span-6">
									<m.div
										initial={shouldReduceMotion ? {} : { opacity: 0, y: 12 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ duration: 0.4, ease: iOSEase }}
									>
										<h1 className="ios-title-1 mb-3 text-balance font-semibold tracking-tight">
											{current.title}
										</h1>
										<p className="ios-body mb-8 text-pretty text-muted-foreground leading-relaxed">
											{current.body}
										</p>

										{step === 1 && (
											<>
												<div className="mb-4">
													<input
														type="text"
														value={searchTerm}
														onChange={(e) => setSearchTerm(e.target.value)}
														placeholder="Search subjects…"
														className="w-full rounded-lg border border-bg-muted/50 bg-card/50 px-3 py-2 text-base focus:border-[--system-accent]/50 focus:outline-none"
													/>
												</div>

												{filteredSubjects.length === 0 && searchTerm !== "" ? (
													<p className="mb-4 text-muted-foreground text-xs italic">
														No subjects match &quot;{searchTerm}&quot;. Try a
														different search.
													</p>
												) : null}

												<m.div
													initial={
														shouldReduceMotion ? {} : { opacity: 0, y: 8 }
													}
													animate={{ opacity: 1, y: 0 }}
													transition={{
														duration: 0.3,
														delay: 0.15,
														ease: iOSEase,
													}}
													className="grid max-h-80 grid-cols-1 gap-3 overflow-y-auto pr-1 sm:grid-cols-2"
												>
													{filteredSubjects.map((subject) => (
														<Card
															key={subject.id}
															className={`cursor-pointer transition-colors duration-150 hover:ring-2 hover:ring-[--system-accent] active:scale-[0.97] ${
																selectedSubjects.includes(subject.id)
																	? "bg-[--system-accent]/5 ring-2 ring-[--system-accent]"
																	: ""
															}`}
															onClick={() =>
																setSelectedSubjects((prev) =>
																	prev.includes(subject.id)
																		? prev.filter((s) => s !== subject.id)
																		: [...prev, subject.id],
																)
															}
														>
															<CardContent className="flex items-center gap-3 py-4">
																<div
																	className="flex size-10 items-center justify-center rounded-full font-extrabold text-sm text-white"
																	style={
																		{
																			"--subject-color": subject.color,
																			backgroundColor: "var(--subject-color)",
																		} as React.CSSProperties
																	}
																>
																	{subject.id.slice(0, 2)}
																</div>
																<div className="min-w-0 flex-1">
																	<p className="truncate font-medium text-sm">
																		{subject.name}
																	</p>
																	<p className="text-muted-foreground text-xs">
																		Grade 12
																	</p>
																</div>
															</CardContent>
														</Card>
													))}
												</m.div>
											</>
										)}

										{step === 2 && (
											<m.div
												initial={shouldReduceMotion ? {} : { opacity: 0, y: 8 }}
												animate={{ opacity: 1, y: 0 }}
												transition={{
													duration: 0.3,
													delay: 0.15,
													ease: iOSEase,
												}}
											>
												<div className="mb-6">
													<div className="mb-1 font-extrabold text-4xl text-foreground tabular-nums">
														{targetAps}
													</div>
													<p className="ios-subhead text-muted-foreground">
														Target APS
													</p>
													<div className="mt-2">
														<Slider
															min={20}
															max={50}
															value={[targetAps]}
															onValueChange={(v) =>
																setTargetAps(Array.isArray(v) ? v[0] : v)
															}
														/>
														<div className="mt-1 flex justify-between text-muted-foreground text-xs">
															<span>20 (Minimum)</span>
															<span>50 (Top)</span>
														</div>
													</div>
												</div>

												<div className="mb-6">
													<div className="mb-1 font-extrabold text-4xl text-foreground tabular-nums">
														{dailyMinutes}
													</div>
													<p className="ios-subhead text-muted-foreground">
														Minutes per day
													</p>
													<div className="mt-2">
														<Slider
															min={10}
															max={120}
															step={10}
															value={[dailyMinutes]}
															onValueChange={(v) =>
																setDailyMinutes(Array.isArray(v) ? v[0] : v)
															}
														/>
														<div className="mt-1 flex justify-between text-muted-foreground text-xs">
															<span>10 min</span>
															<span>120 min</span>
														</div>
													</div>
													<div className="mt-3 flex gap-2">
														{[15, 30, 45, 60].map((m) => (
															<Button
																key={m}
																variant={
																	dailyMinutes === m ? "default" : "outline"
																}
																size="sm"
																onClick={() => setDailyMinutes(m)}
																className="flex-1"
															>
																{m}min
															</Button>
														))}
													</div>
												</div>

												<div className="rounded-xl bg-system-surface-secondary p-4">
													<p className="text-muted-foreground text-sm">
														<strong className="text-foreground">Tip:</strong>{" "}
														Most universities need 23-27 APS. Medicine and
														Engineering typically need 35+.
													</p>
												</div>
											</m.div>
										)}
									</m.div>
								</div>

								<div className="col-span-12 flex items-center justify-center py-8 md:col-span-6">
									<m.div
										initial={
											shouldReduceMotion ? {} : { opacity: 0, scale: 0.96 }
										}
										animate={{ opacity: 1, scale: 1 }}
										transition={{ duration: 0.4, ease: iOSEase, delay: 0.08 }}
										className="h-56 w-56 md:h-64 md:w-64"
									>
										<current.SVG />
									</m.div>
								</div>
							</div>
						) : (
							<div className="flex flex-col items-center justify-center py-12 text-center">
								<m.div
									initial={shouldReduceMotion ? {} : { opacity: 0, scale: 0.9 }}
									animate={{ opacity: 1, scale: 1 }}
									transition={{ duration: 0.5, ease: iOSEase }}
									className="mb-8 size-48"
								>
									<WelcomeSVG />
								</m.div>
								<m.div
									initial={shouldReduceMotion ? {} : { opacity: 0, y: 12 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.4, delay: 0.15, ease: iOSEase }}
									className="max-w-md"
								>
									<h1 className="ios-title-1 mb-3 text-balance font-semibold tracking-tight">
										{current.title}
									</h1>
									<p className="ios-body mb-6 text-pretty text-muted-foreground leading-relaxed">
										{current.body}
									</p>

									{selectedSubjects.length > 0 && (
										<m.div
											initial="hidden"
											animate="visible"
											variants={{
												visible: {
													transition: { staggerChildren: 0.04 },
												},
											}}
											className="mb-8 flex flex-wrap justify-center gap-2"
										>
											{selectedSubjects.map((id) => {
												const sub = nscSubjects.find((s) => s.id === id);
												return sub ? (
													<m.span
														key={id}
														variants={{
															hidden: { opacity: 0, scale: 0.9 },
															visible: { opacity: 1, scale: 1 },
														}}
														className="rounded-full border border-border/40 px-3 py-1 font-medium text-xs"
													>
														{sub.name}
													</m.span>
												) : null;
											})}
										</m.div>
									)}

									<p className="text-pretty text-muted-foreground text-xs">
										You can change everything later in Settings.
									</p>
								</m.div>
							</div>
						)}
					</m.div>
				</AnimatePresence>

				<div className="mt-8 flex items-center justify-between border-border/40 border-t pt-4">
					<div>
						{step > 0 && step < 3 && (
							<Button variant="ghost" onClick={handleBack}>
								<HugeiconsIcon
									icon={ArrowLeft01Icon}
									data-icon="inline-start"
								/>
								Back
							</Button>
						)}
					</div>
					<div className="flex items-center gap-2">
						{step < 3 && (
							<Button
								variant="ghost"
								onClick={complete}
								disabled={isCompleting}
							>
								Skip
							</Button>
						)}
						<Button
							onClick={handleNext}
							disabled={!canProceed() || isCompleting}
						>
							{current.cta}
							<HugeiconsIcon icon={ArrowRight01Icon} data-icon="inline-end" />
						</Button>
					</div>
				</div>
			</PageContainer>
		</div>
	);
}
