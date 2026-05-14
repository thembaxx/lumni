"use client";

import {
	ArrowLeft,
	ArrowRight,
	Bell,
	BookOpen,
	Check,
	Clock,
	Target,
} from "@phosphor-icons/react";
import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { PerpetualFloat } from "@/components/shared/perpetual-float";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { nscSubjects } from "@/data/nsc-subjects";
import { useOnboarding } from "@/hooks/use-onboarding";
import { iOSEase } from "@/lib/utils/animation";

interface OnboardingWizardProps {
	onComplete?: () => void;
}

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

	const steps = [
		{ title: "Welcome", icon: BookOpen },
		{ title: "Subjects", icon: BookOpen },
		{ title: "Goals", icon: Target },
		{ title: "Schedule", icon: Clock },
		{ title: "Notifications", icon: Bell },
	];

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
		if (step < steps.length - 1) {
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

	const toggleSubject = (id: string) => {
		setSelectedSubjects((prev) =>
			prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
		);
	};

	return (
		<div className="fixed inset-0 bg-background z-50 overflow-y-auto">
			<div className="min-h-full flex flex-col p-4 md:p-8 max-w-5xl mx-auto w-full">
				<div className="flex items-center gap-2 mb-8">
					{steps.map((s, i) => (
						<div
							key={i}
							className={`flex-1 h-1 rounded-full transition-colors ${
								i <= step ? "bg-[--system-accent]" : "bg-muted"
							}`}
						/>
					))}
				</div>

				<div className="flex-1">
					{step === 0 && (
						<div className="grid grid-cols-12 gap-6 items-center">
							<motion.div
								className="col-span-12 md:col-span-6"
								initial={{ opacity: 0, x: -20 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ duration: 0.4, ease: "easeOut" }}
							>
								<h1 className="text-3xl font-bold mb-4 tracking-tight">
									Welcome to Lumni
								</h1>
								<p className="text-muted-foreground text-lg mb-8 leading-relaxed">
									Your AI-powered study companion to help you pass your Matric
									with confidence.
								</p>
								<div className="grid grid-cols-2 gap-4">
									<div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
										<span className="text-2xl">📝</span>
										<span>Quizzes</span>
									</div>
									<div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
										<span className="text-2xl">🃏</span>
										<span>Flashcards</span>
									</div>
									<div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
										<span className="text-2xl">📚</span>
										<span>Past Papers</span>
									</div>
									<div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
										<span className="text-2xl">🎯</span>
										<span>AI Tutors</span>
									</div>
								</div>
							</motion.div>

							<div className="col-span-12 md:col-span-6 flex justify-center">
								<div className="relative">
									{!shouldReduceMotion && (
										<PerpetualFloat
											className="absolute -right-4 top-1/2 -translate-y-1/2"
											duration={10}
											offsetY={-12}
										>
											<div className="size-20 rounded-2xl bg-[--system-accent]/10 blur-xl" />
										</PerpetualFloat>
									)}
									<div className="text-8xl mb-6 relative z-10">🎓</div>
									<div className="absolute inset-0 bg-gradient-to-br from-[--system-accent]/5 via-transparent to-transparent rounded-3xl" />
								</div>
							</div>
						</div>
					)}

					{step === 1 && (
						<motion.div
							className="grid grid-cols-12 gap-6"
							initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.35, ease: iOSEase }}
						>
							<div className="col-span-12 md:col-span-7">
								<h2 className="text-2xl font-bold mb-2">
									Choose Your Subjects
								</h2>
								<p className="text-muted-foreground mb-6">
									Select the subjects you're taking for your Matric exams.
								</p>
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
									{nscSubjects.map((subject) => (
										<Card
											key={subject.id}
											className={`cursor-pointer transition-colors duration-200 hover:ring-2 hover:ring-[--system-accent] ${
												selectedSubjects.includes(subject.id)
													? "ring-2 ring-[--system-accent] bg-[--system-accent]/5"
													: ""
											}`}
											onClick={() => toggleSubject(subject.id)}
										>
											<CardContent className="flex items-center gap-3 py-4">
												<div
													className="size-10 rounded-full flex items-center justify-center text-white font-bold"
													style={{ backgroundColor: subject.color }}
												>
													{subject.id.slice(0, 2)}
												</div>
												<div className="flex-1 min-w-0">
													<p className="font-medium truncate">{subject.name}</p>
													<p className="text-xs text-muted-foreground">
														Grade 12
													</p>
												</div>
												{selectedSubjects.includes(subject.id) && (
													<Check className="size-5 text-foreground" />
												)}
											</CardContent>
										</Card>
									))}
								</div>
								<p className="text-sm text-muted-foreground mt-4">
									{selectedSubjects.length} subject
									{selectedSubjects.length !== 1 ? "s" : ""} selected
								</p>
							</div>
							<div className="col-span-12 md:col-span-5 flex items-center justify-center">
								{!shouldReduceMotion && (
									<PerpetualFloat duration={12} offsetY={-16}>
										<div className="size-32 rounded-3xl bg-[--system-accent]/10 blur-2xl" />
									</PerpetualFloat>
								)}
							</div>
						</motion.div>
					)}

					{step === 2 && (
						<div className="grid grid-cols-12 gap-6">
							<div className="col-span-12 md:col-span-7">
								<motion.div
									initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.35, ease: iOSEase }}
									className="flex flex-col gap-4"
								>
									<h2 className="text-2xl font-bold mb-2">Set Your Target</h2>
									<p className="text-muted-foreground mb-6">
										What's your desired APS (Admission Point Score)?
									</p>
									<div className="text-left mb-8">
										<div className="text-6xl font-bold text-foreground mb-2">
											{targetAps}
										</div>
										<p className="text-muted-foreground">Target APS</p>
									</div>
									<div className="flex flex-col gap-4">
										<Slider
											min={20}
											max={50}
											value={[targetAps]}
											onValueChange={(v) =>
												setTargetAps(Array.isArray(v) ? v[0] : v)
											}
										/>
										<div className="flex justify-between text-sm text-muted-foreground">
											<span>20 (Minimum)</span>
											<span>50 (Top)</span>
										</div>
									</div>
									<div className="mt-8 p-4 bg-muted rounded-lg">
										<p className="text-sm">
											<strong>💡 Tip:</strong> Most universities require at
											least 23-27 APS for admission. Medicine and Engineering
											typically need 35+.
										</p>
									</div>
								</motion.div>
							</div>
							<div className="col-span-12 md:col-span-5 flex items-center justify-center">
								{!shouldReduceMotion && (
									<PerpetualFloat duration={8} offsetY={-10}>
										<div className="size-28 rounded-3xl bg-info/10 blur-2xl" />
									</PerpetualFloat>
								)}
							</div>
						</div>
					)}

					{step === 3 && (
						<div className="grid grid-cols-12 gap-6">
							<div className="col-span-12 md:col-span-7">
								<motion.div
									initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.35, ease: iOSEase }}
									className="flex flex-col gap-4"
								>
									<h2 className="text-2xl font-bold mb-2">Daily Study Time</h2>
									<p className="text-muted-foreground mb-6">
										How much time can you commit to studying each day?
									</p>
									<div className="text-left mb-8">
										<div className="text-6xl font-bold text-foreground mb-2">
											{dailyMinutes}
										</div>
										<p className="text-muted-foreground">minutes per day</p>
									</div>
									<div className="flex flex-col gap-4">
										<Slider
											min={10}
											max={120}
											step={10}
											value={[dailyMinutes]}
											onValueChange={(v) =>
												setDailyMinutes(Array.isArray(v) ? v[0] : v)
											}
										/>
										<div className="flex justify-between text-sm text-muted-foreground">
											<span>10 min</span>
											<span>120 min</span>
										</div>
									</div>
									<div className="mt-8 grid grid-cols-3 sm:grid-cols-12 gap-2 md:text-left">
										<Button
											variant={dailyMinutes === 15 ? "default" : "outline"}
											size="sm"
											onClick={() => setDailyMinutes(15)}
											className="col-span-3 sm:col-span-5"
										>
											15 min
										</Button>
										<Button
											variant={dailyMinutes === 30 ? "default" : "outline"}
											size="sm"
											onClick={() => setDailyMinutes(30)}
											className="col-span-3 sm:col-span-3"
										>
											30 min
										</Button>
										<Button
											variant={dailyMinutes === 60 ? "default" : "outline"}
											size="sm"
											onClick={() => setDailyMinutes(60)}
											className="col-span-3 sm:col-span-4"
										>
											60 min
										</Button>
									</div>
								</motion.div>
							</div>
							<div className="col-span-12 md:col-span-5 flex items-center justify-center">
								{!shouldReduceMotion && (
									<PerpetualFloat duration={9} offsetY={-12}>
										<div className="size-24 rounded-full bg-success/10 blur-2xl" />
									</PerpetualFloat>
								)}
							</div>
						</div>
					)}

					{step === 4 && (
						<div className="grid grid-cols-12 gap-6">
							<div className="col-span-12 md:col-span-7">
								<motion.div
									initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.35, ease: iOSEase }}
									className="flex flex-col gap-4"
								>
									<h2 className="text-2xl font-bold mb-2">Stay Connected</h2>
									<p className="text-muted-foreground mb-6">
										Enable notifications to get study reminders and track your
										progress.
									</p>
									<div
										className={`p-4 rounded-lg border ${notifications ? "ring-2 ring-[--system-accent]" : "border-border/80"} bg-card shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]`}
									>
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-3">
												<div className="text-2xl">🔔</div>
												<div>
													<p className="font-medium">Push Notifications</p>
													<p className="text-sm text-muted-foreground">
														Get daily reminders and achievement alerts
													</p>
												</div>
											</div>
											<Button
												variant={notifications ? "default" : "outline"}
												size="sm"
												onClick={() => setNotifications(!notifications)}
											>
												{notifications ? "Enabled" : "Disabled"}
											</Button>
										</div>
									</div>
									<div className="mt-6 p-4 bg-muted rounded-lg">
										<p className="text-sm text-muted-foreground">
											You can change this anytime in Settings → Notifications.
										</p>
									</div>
								</motion.div>
							</div>
							<div className="col-span-12 md:col-span-5 flex items-center justify-center">
								{!shouldReduceMotion && (
									<PerpetualFloat duration={11} offsetY={-14}>
										<div className="size-20 rounded-3xl bg-warning/10 blur-2xl" />
									</PerpetualFloat>
								)}
							</div>
						</div>
					)}
				</div>

				<div className="flex items-center justify-between mt-8 pt-4 border-t">
					<div>
						{step > 0 && (
							<Button variant="ghost" onClick={handleBack}>
								<ArrowLeft data-icon="inline-start" />
								Back
							</Button>
						)}
					</div>
					<div className="flex items-center gap-2">
						{step > 0 && step < steps.length - 1 && (
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
							{step === steps.length - 1 ? "Get Started" : "Continue"}
							<ArrowRight data-icon="inline-end" />
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
