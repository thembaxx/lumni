"use client";

import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { motion, useReducedMotion } from "framer-motion";
import { requestPermission, subscribeToPush, scheduleStudyReminder, saveSettings } from "@/lib/services/notification-service";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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
		SVG: WelcomeSVG,
	},
	{
		title: "Choose Your Subjects",
		body: "Pick the subjects you're taking this year so we can tailor your practice.",
		cta: "Continue",
		SVG: SubjectsSVG,
	},
	{
		title: "Set Your Target",
		body: "What APS are you working towards? Don't worry — this is just a starting point.",
		cta: "Continue",
		SVG: GoalsSVG,
	},
	{
		title: "Your Daily Study Time",
		body: "How much time can you realistically commit each day? Even 10 minutes makes a difference.",
		cta: "Continue",
		SVG: ScheduleSVG,
	},
	{
		title: "Stay on Track",
		body: "Get gentle reminders so you never miss a study session.",
		cta: "Get Started",
		SVG: NotificationsSVG,
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
	const [notifications, setNotifications] = useState(
		data.notificationsEnabled,
	);
	const [notificationFrequency, setNotificationFrequency] = useState<
		"daily" | "every_other_day" | "weekly"
	>(data.notificationFrequency ?? "daily");
	const [notificationTimeOfDay, setNotificationTimeOfDay] = useState<
		"morning" | "afternoon" | "evening" | undefined
	>(data.notificationTimeOfDay ?? "morning");
	const [searchTerm, setSearchTerm] = useState("");
	const shouldReduceMotion = useReducedMotion();

	// Reset search term when leaving step 1
	useEffect(() => {
		if (step !== 1) {
			setSearchTerm("");
		}
	}, [step]);

	// Update onboarding progress whenever step or main fields change
	useEffect(() => {
		updateProgress({
			currentStep: step,
			selectedSubjects,
			targetAps,
			dailyStudyMinutes: dailyMinutes,
			notificationsEnabled: notifications,
			notificationFrequency,
			notificationTimeOfDay,
		});
	}, [
		step,
		selectedSubjects,
		targetAps,
		dailyMinutes,
		notifications,
		notificationFrequency,
		notificationTimeOfDay,
		updateProgress,
	]);

	const current = STEPS_COPY[step];

	// Filter subjects based on search term
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
				return targetAps >= 20 && targetAps <= 50;
			case 3:
				return dailyMinutes >= 10 && dailyMinutes <= 120;
			case 4:
				return true; // Notification step: we can proceed with defaults
			default:
				return true;
		}
	};

	const handleNext = () => {
		if (step === 4 && notifications) {
			requestPermission().then((granted) => {
				if (granted) {
					subscribeToPush();
					const hour = notificationTimeOfDay === "morning" ? 9 : notificationTimeOfDay === "afternoon" ? 14 : 19;
					saveSettings({
						enabled: true,
						studyReminders: true,
						streakAlerts: true,
						quizReminders: false,
						reminderHour: hour,
					});
					scheduleStudyReminder();
				}
			});
		}
		if (step < STEPS_COPY.length - 1) {
			setStep(step + 1);
		} else {
			completeOnboarding({
				selectedSubjects,
				targetAps,
				dailyStudyMinutes: dailyMinutes,
				notificationsEnabled: notifications,
				notificationFrequency,
				notificationTimeOfDay,
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
									<>
										<div className="mb-4">
											<label className="block text-sm font-medium text-muted-foreground mb-2">
												Search01Icon subjects
											</label>
											<input
												type="text"
												value={searchTerm}
												onChange={(e) => setSearchTerm(e.target.value)}
												placeholder="Search by subject name..."
												className="w-full px-3 py-2 rounded-lg border border-bg-muted/50 bg-card/50 text-sm focus:outline-none focus:border-[--system-accent]/50"
											/>
										</div>

										{filteredSubjects.length === 0 && searchTerm !== "" ? (
											<p className="text-xs text-muted-foreground italic mb-4">
												No subjects match "{searchTerm}". Try a different
												search.
											</p>
										) : null}

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
											{filteredSubjects.map((subject) => (
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
									</>
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
												Target01Icon APS
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
										<div className="mb-6 flex items-center justify-between">
											<div>
												<div className="text-5xl font-extrabold text-foreground mb-1">
													{notifications ? "On" : "Off"}
												</div>
												<p className="ios-subhead text-muted-foreground">
													Notifications
												</p>
											</div>
											<Switch
												checked={notifications}
												onCheckedChange={(checked) => {
													setNotifications(checked);
													if (checked) {
														requestPermission().then((granted) => {
															if (granted) subscribeToPush();
														});
													}
												}}
											/>
										</div>
										<div className="flex flex-col gap-4 mb-6">
											<div className="flex items-center gap-3">
												<p className="font-medium text-sm">Frequency</p>
												<div className="flex space-x-3">
													{[
														["daily", "Daily"],
														["every_other_day", "Every other day"],
														["weekly", "Weekly"],
													].map(([value, label]) => (
														<Button
															key={value}
															variant={
																notificationFrequency === value
																	? "default"
																	: "outline"
															}
															size="sm"
															onClick={() =>
																setNotificationFrequency(
																	value as
																		| "daily"
																		| "every_other_day"
																		| "weekly",
																)
															}
															className="px-3 py-1 rounded text-xs"
														>
															{label}
														</Button>
													))}
												</div>
											</div>
											<div className="flex items-center gap-3">
												<p className="font-medium text-sm">Time of day</p>
												<div className="flex space-x-3">
													{[
														["morning", "Morning"],
														["afternoon", "Afternoon"],
														["evening", "Evening"],
													].map(([value, label]) => (
														<Button
															key={value}
															variant={
																notificationTimeOfDay === value
																	? "default"
																	: "outline"
															}
															size="sm"
															onClick={() =>
																setNotificationTimeOfDay(
																	value as "morning" | "afternoon" | "evening",
																)
															}
															className="px-3 py-1 rounded text-xs"
														>
															{label}
														</Button>
													))}
												</div>
											</div>
										</div>
									</motion.div>
								)}

								{step === 4 && notifications && (
									<p className="text-xs text-muted-foreground mt-2">
										We'll send you study reminders to keep you on track.
									</p>
								)}
								<p className="text-xs text-muted-foreground mt-2">
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
								<current.SVG />
							</motion.div>
						</div>
					</div>
				</div>

				<div className="flex items-center justify-between mt-8 pt-4 border-t border-border/40">
					<div>
						{step > 0 && (
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
						{step > 0 && step < STEPS_COPY.length - 1 && (
							<Button
								variant="ghost"
								onClick={() => {
									completeOnboarding({
										selectedSubjects,
										targetAps,
										dailyStudyMinutes: dailyMinutes,
										notificationsEnabled: notifications,
										notificationFrequency,
										notificationTimeOfDay,
									});
									onComplete?.();
								}}
							>
								Skip
							</Button>
						)}
						<Button onClick={handleNext} disabled={!canProceed()}>
							{current.cta}
							<HugeiconsIcon icon={ArrowRight01Icon} data-icon="inline-end" />
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
