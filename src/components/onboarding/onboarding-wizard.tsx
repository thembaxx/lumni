"use client";

import {
	ArrowDownIcon,
	ArrowLeft01Icon,
	ArrowRight01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Confetti } from "@/components/celebration/confetti";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import subjectsData from "@/data/subjects.json";
import { useOnboarding } from "@/hooks/use-onboarding";
import { saveLocalEnrolledSubjects } from "@/hooks/use-subjects";
import { useAuth } from "@/lib/auth/auth-context";
import { iOSEase } from "@/lib/utils/animation";
import { SubjectCard } from "./subject-card";
import { GoalsSVG } from "./svgs/goals-svg";
import { SubjectsSVG } from "./svgs/subjects-svg";
import { WelcomeSVG } from "./svgs/welcome-svg";

type Subject = (typeof subjectsData)[number];

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

// TODO(react-doctor): Extract StepIndicator into separate component (~20 lines)
// TODO(react-doctor): Extract WelcomeStep into separate component (~20 lines)
// TODO(react-doctor): Extract SubjectSelectionStep into separate component (~170 lines)
// TODO(react-doctor): Extract GoalsStep into separate component (~80 lines)
// TODO(react-doctor): Extract CompleteStep into separate component (~60 lines)
// TODO(react-doctor): Extract WizardFooter into separate component (~30 lines)
// TODO(react-doctor): Refactor multiple useState calls into useReducer
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
		updateProgress({
			currentStep: step,
			selectedSubjects,
			targetAps,
			dailyStudyMinutes: dailyMinutes,
		});
	}, [step, selectedSubjects, targetAps, dailyMinutes, updateProgress]);

	const current = STEPS_COPY[step];
	const { user } = useAuth();

	const categoryLabels: Record<string, string> = {
		sciences: "Sciences",
		languages: "Languages",
		business: "Business",
		humanities: "Humanities",
		technology: "Technology",
		agriculture: "Agriculture",
		arts: "Arts",
		services: "Services",
		compulsory: "Compulsory",
	};

	const subjectsByCategory = useMemo(() => {
		const groups: Record<string, Subject[]> = {};
		for (const subject of subjectsData) {
			const cat = subject.category || "other";
			if (!groups[cat]) groups[cat] = [];
			groups[cat].push(subject);
		}
		for (const cat of Object.keys(groups)) {
			groups[cat].sort((a, b) => a.name.localeCompare(b.name));
		}
		return groups;
	}, []);

	const categoryOrder = [
		"sciences",
		"languages",
		"business",
		"humanities",
		"technology",
		"agriculture",
		"arts",
		"services",
		"compulsory",
	];

	const [expandedCategories, setExpandedCategories] = useState<
		Record<string, boolean>
	>(() => {
		const initial: Record<string, boolean> = {};
		for (const cat of categoryOrder) {
			initial[cat] = false;
		}
		initial.sciences = true;
		return initial;
	});

	const filteredSubjects = searchTerm
		? subjectsData.filter((subject) =>
				subject.name.toLowerCase().includes(searchTerm.toLowerCase()),
			)
		: null;

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

	const complete = useCallback(async () => {
		if (isCompleting) return;
		setIsCompleting(true);

		completeOnboarding({
			selectedSubjects,
			targetAps,
			dailyStudyMinutes: dailyMinutes,
		});

		if (user) {
			try {
				await fetch("/api/subjects/enroll", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ subjectIds: selectedSubjects }),
				});
			} catch {}
		} else {
			saveLocalEnrolledSubjects(selectedSubjects);
		}

		setShowConfetti(true);
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
		user,
	]);

	const handleNext = () => {
		if (step === STEPS_COPY.length - 1) {
			complete();
			return;
		}
		if (step === 1) setSearchTerm("");
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
														onChange={(e) => {
															setSearchTerm(e.target.value);
															if (e.target.value) {
																setExpandedCategories(() => {
																	const all: Record<string, boolean> = {};
																	for (const cat of categoryOrder) {
																		all[cat] = true;
																	}
																	return all;
																});
															}
														}}
														placeholder="Search subjects…"
														className="w-full rounded-lg border border-bg-muted/50 bg-card/50 px-3 py-2 text-base focus:border-[--system-accent]/50 focus:outline-none"
														aria-label="Search subjects"
													/>
												</div>

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
													className="max-h-80 space-y-2 overflow-y-auto pr-1"
												>
													{searchTerm ? (
														filteredSubjects &&
														filteredSubjects.length === 0 ? (
															<p className="py-4 text-center text-muted-foreground text-xs italic">
																No subjects match &quot;{searchTerm}&quot;. Try
																a different search.
															</p>
														) : (
															<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
																{filteredSubjects?.map((subject) => (
																	<SubjectCard
																		key={subject.id}
																		subject={subject}
																		selected={selectedSubjects.includes(
																			subject.id,
																		)}
																		onToggle={() =>
																			setSelectedSubjects((prev) =>
																				prev.includes(subject.id)
																					? prev.filter((s) => s !== subject.id)
																					: [...prev, subject.id],
																			)
																		}
																	/>
																))}
															</div>
														)
													) : (
														categoryOrder.flatMap((cat) =>
															subjectsByCategory[cat]
																? [
																		(() => {
																			const subjects = subjectsByCategory[cat];
																			const selectedCount = subjects.filter(
																				(s) => selectedSubjects.includes(s.id),
																			).length;
																			const isExpanded =
																				expandedCategories[cat];
																			return (
																				<div
																					key={cat}
																					className="rounded-xl border border-border/40 bg-card/30"
																				>
																					<button
																						type="button"
																						onClick={() =>
																							setExpandedCategories((prev) => ({
																								...prev,
																								[cat]: !prev[cat],
																							}))
																						}
																						className="flex w-full items-center gap-2 px-4 py-3 text-left"
																					>
																						<HugeiconsIcon
																							icon={ArrowDownIcon}
																							className={`size-4 text-muted-foreground transition-transform duration-200 ${
																								isExpanded
																									? "rotate-0"
																									: "-rotate-90"
																							}`}
																						/>
																						<span className="flex-1 font-semibold text-sm capitalize">
																							{categoryLabels[cat] || cat}
																						</span>
																						<span className="text-muted-foreground text-xs">
																							{selectedCount > 0
																								? `${selectedCount} selected`
																								: `${subjects.length} subjects`}
																						</span>
																					</button>
																					<AnimatePresence initial={false}>
																						{isExpanded && (
																							<m.div
																								initial={
																									shouldReduceMotion
																										? {}
																										: { height: 0, opacity: 0 }
																								}
																								animate={{
																									height: "auto",
																									opacity: 1,
																								}}
																								exit={
																									shouldReduceMotion
																										? {}
																										: { height: 0, opacity: 0 }
																								}
																								transition={{
																									duration: 0.2,
																									ease: iOSEase,
																								}}
																								className="overflow-hidden"
																							>
																								<div className="grid grid-cols-1 gap-2 px-4 pb-3 sm:grid-cols-2">
																									{subjects.map((subject) => (
																										<SubjectCard
																											key={subject.id}
																											subject={subject}
																											selected={selectedSubjects.includes(
																												subject.id,
																											)}
																											onToggle={() =>
																												setSelectedSubjects(
																													(prev) =>
																														prev.includes(
																															subject.id,
																														)
																															? prev.filter(
																																	(s) =>
																																		s !==
																																		subject.id,
																																)
																															: [
																																	...prev,
																																	subject.id,
																																],
																												)
																											}
																										/>
																									))}
																								</div>
																							</m.div>
																						)}
																					</AnimatePresence>
																				</div>
																			);
																		})(),
																	]
																: [],
														)
													)}
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
												const sub = subjectsData.find((s) => s.id === id);
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
