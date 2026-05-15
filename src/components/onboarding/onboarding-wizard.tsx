"use client";

import {
	ArrowLeft,
	ArrowRight,
	Bell,
	BookOpen,
	Clock,
	Target,
} from "@phosphor-icons/react";
import { motion, useReducedMotion } from "framer-motion";
import dynamic from "next/dynamic";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { nscSubjects } from "@/data/nsc-subjects";
import { useOnboarding } from "@/hooks/use-onboarding";
import { iOSEase } from "@/lib/utils/animation";
import {
	GoalsSVG,
	NotificationsSVG,
	ScheduleSVG,
	SubjectsSVG,
	WelcomeSVG,
} from "./svgs";

const ParticleField = dynamic(
	() => import("./particle-field").then((m) => ({ default: m.ParticleField })),
	{ ssr: false },
);

interface OnboardingWizardProps {
	onComplete?: () => void;
}

const STEPS_COPY = [
	{
		title: "Welcome to Lumni",
		body: "Your AI study buddy for Matric. Quizzes, flashcards, past papers — all in one place. Let's get you set up in under a minute.",
		cta: "Let's go",
		icon: BookOpen,
		SVG: WelcomeSVG,
	},
	{
		title: "Choose Your Subjects",
		body: "Pick the subjects you're taking this year so we can tailor your practice.",
		cta: "Continue",
		icon: BookOpen,
		SVG: SubjectsSVG,
	},
	{
		title: "Set Your Target",
		body: "What APS are you working towards? Don't worry — this is just a starting point.",
		cta: "Continue",
		icon: Target,
		SVG: GoalsSVG,
	},
	{
		title: "Your Daily Study Time",
		body: "How much time can you realistically commit each day? Even 10 minutes makes a difference.",
		cta: "Continue",
		icon: Clock,
		SVG: ScheduleSVG,
	},
	{
		title: "Stay on Track",
		body: "Get gentle reminders so you never miss a study session.",
		cta: "Get Started",
		icon: Bell,
		SVG: NotificationsSVG,
	},
];

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
	const { data, completeOnboarding } = useOnboarding();
	const [step, setStep] = useState(0);
	const [selectedSubjects, setSelectedSubjects] = useState<string[]>(
		data.selectedSubjects,
	);
	const [targetAps, setTargetAps] = useState(data.targetAps);
	const [dailyMinutes, setDailyMinutes] = useState(data.dailyStudyMinutes);
	const [notifications, setNotifications] = useState(data.notificationsEnabled);
	const shouldReduceMotion = useReducedMotion();

	const current = STEPS_COPY[step];
	const SVG = current.SVG;

	const canProceed = () => {
		switch (step) {
			case 0:
				return true;
			case 1:
				return selectedSubjects.length > 0;
			case 2:
				return targetAps >= 20 && targetAps <= 50;
			case 3:
				return dailyMinutes >= 10 && dailyMinutes <= 120;
			case 4:
				return true;
			default:
				return true;
		}
	};

	const handleNext = () => {
		if (step < STEPS_COPY.length - 1) {
			setStep(step + 1);
		} else {
			completeOnboarding({
				selectedSubjects,
				targetAps,
				dailyStudyMinutes: dailyMinutes,
				notificationsEnabled: notifications,
			});
			onComplete?.();
		}
	};

	const handleBack = () => {
		if (step > 0) {
			setStep(step - 1);
		}
	};

	return (
		<div className="fixed inset-0 bg-system-grouped z-50 overflow-y-auto">
			<ParticleField step={step} />

			<div className="relative z-10 min-h-full flex flex-col p-4 md:p-8 max-w-5xl mx-auto w-full">
				<div className="flex items-center gap-2 mb-8">
					{STEPS_COPY.map((_, i) => (
						<motion.div
							key={i}
							className={`flex-1 h-1 rounded-full ${
								i <= step ? "bg-[--system-accent]" : "bg-[--system-separator]"
							}`}
							animate={{
								backgroundColor:
									i <= step
										? "var(--system-accent)"
										: "var(--system-separator)",
							}}
							transition={{ duration: 0.3, ease: iOSEase }}
						/>
					))}
				</div>

				<div className="flex-1">
					<div className="grid grid-cols-12 gap-6 items-center">
						<div className="col-span-12 md:col-span-6">
							<motion.div
								key={`text-${step}`}
								initial={shouldReduceMotion ? {} : { opacity: 0, y: 12 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.4, ease: iOSEase }}
							>
								<h1 className="ios-title-1 font-extrabold mb-3 tracking-tight">
									{current.title}
								</h1>
								<p className="ios-body text-muted-foreground mb-8 leading-relaxed">
									{current.body}
								</p>

								{step === 1 && (
									<motion.div
										initial={shouldReduceMotion ? {} : { opacity: 0, y: 8 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{
											duration: 0.3,
											delay: 0.15,
											ease: iOSEase,
										}}
										className="grid grid-cols-1 sm:grid-cols-2 gap-3"
									>
										{nscSubjects.map((subject) => (
											<Card
												key={subject.id}
												className={`cursor-pointer transition-colors duration-200 hover:ring-2 hover:ring-[--system-accent] ${
													selectedSubjects.includes(subject.id)
														? "ring-2 ring-[--system-accent] bg-[--system-accent]/5"
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
														className="size-10 rounded-full flex items-center justify-center text-white font-extrabold text-sm"
														style={{ backgroundColor: subject.color }}
													>
														{subject.id.slice(0, 2)}
													</div>
													<div className="flex-1 min-w-0">
														<p className="font-medium truncate text-sm">
															{subject.name}
														</p>
														<p className="text-xs text-muted-foreground">
															Grade 12
														</p>
													</div>
												</CardContent>
											</Card>
										))}
									</motion.div>
								)}

								{step === 2 && (
									<motion.div
										initial={shouldReduceMotion ? {} : { opacity: 0, y: 8 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{
											duration: 0.3,
											delay: 0.15,
											ease: iOSEase,
										}}
									>
										<div className="mb-6">
											<div className="text-5xl font-extrabold text-foreground mb-1">
												{targetAps}
											</div>
											<p className="ios-subhead text-muted-foreground">
												Target APS
											</p>
										</div>
										<div className="flex flex-col gap-4 mb-6">
											<Slider
												min={20}
												max={50}
												value={[targetAps]}
												onValueChange={(v) =>
													setTargetAps(Array.isArray(v) ? v[0] : v)
												}
											/>
											<div className="flex justify-between text-xs text-muted-foreground">
												<span>20 (Minimum)</span>
												<span>50 (Top)</span>
											</div>
										</div>
										<div className="p-4 rounded-xl bg-system-surface-secondary">
											<p className="text-sm text-muted-foreground">
												<strong className="text-foreground">Tip:</strong> Most
												universities need 23-27 APS. Medicine and Engineering
												typically need 35+.
											</p>
										</div>
									</motion.div>
								)}

								{step === 3 && (
									<motion.div
										initial={shouldReduceMotion ? {} : { opacity: 0, y: 8 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{
											duration: 0.3,
											delay: 0.15,
											ease: iOSEase,
										}}
									>
										<div className="mb-6">
											<div className="text-5xl font-extrabold text-foreground mb-1">
												{dailyMinutes}
											</div>
											<p className="ios-subhead text-muted-foreground">
												minutes per day
											</p>
										</div>
										<div className="flex flex-col gap-4 mb-6">
											<Slider
												min={10}
												max={120}
												step={10}
												value={[dailyMinutes]}
												onValueChange={(v) =>
													setDailyMinutes(Array.isArray(v) ? v[0] : v)
												}
											/>
											<div className="flex justify-between text-xs text-muted-foreground">
												<span>10 min</span>
												<span>120 min</span>
											</div>
										</div>
										<div className="flex gap-2">
											{[15, 30, 45, 60].map((m) => (
												<Button
													key={m}
													variant={dailyMinutes === m ? "default" : "outline"}
													size="sm"
													onClick={() => setDailyMinutes(m)}
													className="flex-1"
												>
													{m}min
												</Button>
											))}
										</div>
									</motion.div>
								)}

								{step === 4 && (
									<motion.div
										initial={shouldReduceMotion ? {} : { opacity: 0, y: 8 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{
											duration: 0.3,
											delay: 0.15,
											ease: iOSEase,
										}}
									>
										<div
											className={`p-5 rounded-xl border ${
												notifications
													? "ring-2 ring-[--system-accent] border-[--system-accent]/20"
													: "border-border/60"
											} bg-card transition-all duration-300`}
										>
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-3">
													<Bell className="size-5 text-foreground" />
													<div>
														<p className="font-semibold text-sm">
															Push Notifications
														</p>
														<p className="text-xs text-muted-foreground">
															Daily reminders and achievement alerts
														</p>
													</div>
												</div>
												<Button
													variant={notifications ? "default" : "outline"}
													size="sm"
													onClick={() => setNotifications(!notifications)}
													className="min-w-[80px]"
												>
													{notifications ? "On" : "Off"}
												</Button>
											</div>
										</div>
									</motion.div>
								)}

								<p className="text-xs text-muted-foreground mt-6">
									You can change everything later.
								</p>
							</motion.div>
						</div>

						<div className="col-span-12 md:col-span-6 flex items-center justify-center py-8">
							<motion.div
								key={`svg-${step}`}
								initial={shouldReduceMotion ? {} : { opacity: 0, scale: 0.96 }}
								animate={{ opacity: 1, scale: 1 }}
								transition={{ duration: 0.4, ease: iOSEase }}
								className="w-64 h-64 md:w-72 md:h-72"
							>
								<SVG />
							</motion.div>
						</div>
					</div>
				</div>

				<div className="flex items-center justify-between mt-8 pt-4 border-t border-border/40">
					<div>
						{step > 0 && (
							<Button variant="ghost" onClick={handleBack}>
								<ArrowLeft data-icon="inline-start" />
								Back
							</Button>
						)}
					</div>
					<div className="flex items-center gap-2">
						{step > 0 && step < STEPS_COPY.length - 1 && (
							<Button
								variant="ghost"
								onClick={() => {
									completeOnboarding({
										selectedSubjects,
										targetAps,
										dailyStudyMinutes: dailyMinutes,
										notificationsEnabled: notifications,
									});
									onComplete?.();
								}}
							>
								Skip
							</Button>
						)}
						<Button onClick={handleNext} disabled={!canProceed()}>
							{current.cta}
							<ArrowRight data-icon="inline-end" />
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
