"use client";

import {
	ArrowLeft,
	ArrowRight,
	Bell,
	BookOpen,
	Check,
	Clock,
	Target,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { nscSubjects } from "@/data/nsc-subjects";
import { useOnboarding } from "@/hooks/use-onboarding";

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
			<div className="min-h-full flex flex-col p-4 md:p-8 max-w-2xl mx-auto">
				<div className="flex items-center gap-2 mb-8">
					{steps.map((s, i) => (
						<div
							key={i}
							className={`flex-1 h-1 rounded-full transition-colors ${
								i <= step ? "bg-primary" : "bg-muted"
							}`}
						/>
					))}
				</div>

				<div className="flex-1">
					{step === 0 && (
						<div className="text-center py-8">
							<div className="text-6xl mb-6">🎓</div>
							<h1 className="text-3xl font-bold mb-4">Welcome to Lumni</h1>
							<p className="text-muted-foreground text-lg mb-8">
								Your AI-powered study companion to help you pass your Matric
								with confidence.
							</p>
							<div className="grid grid-cols-2 gap-4 text-left max-w-sm mx-auto">
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
						</div>
					)}

					{step === 1 && (
						<div>
							<h2 className="text-2xl font-bold mb-2">Choose Your Subjects</h2>
							<p className="text-muted-foreground mb-6">
								Select the subjects you're taking for your Matric exams.
							</p>
							<div className="grid grid-cols-2 gap-3">
								{nscSubjects.map((subject) => (
									<Card
										key={subject.id}
										className={`cursor-pointer transition-all hover:ring-2 hover:ring-primary ${
											selectedSubjects.includes(subject.id)
												? "ring-2 ring-primary bg-primary/5"
												: ""
										}`}
										onClick={() => toggleSubject(subject.id)}
									>
										<CardContent className="p-4 flex items-center gap-3">
											<div
												className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
												style={{ backgroundColor: subject.color }}
											>
												{subject.code.slice(0, 2)}
											</div>
											<div className="flex-1 min-w-0">
												<p className="font-medium truncate">{subject.name}</p>
												<p className="text-xs text-muted-foreground">
													Grade 12
												</p>
											</div>
											{selectedSubjects.includes(subject.id) && (
												<Check className="h-5 w-5 text-primary" />
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
					)}

					{step === 2 && (
						<div>
							<h2 className="text-2xl font-bold mb-2">Set Your Target</h2>
							<p className="text-muted-foreground mb-6">
								What's your desired APS (Admission Point Score)?
							</p>
							<div className="text-center mb-8">
								<div className="text-6xl font-bold text-primary mb-2">
									{targetAps}
								</div>
								<p className="text-muted-foreground">Target APS</p>
							</div>
							<div className="space-y-4">
								<input
									type="range"
									min="20"
									max="50"
									value={targetAps}
									onChange={(e) => setTargetAps(parseInt(e.target.value))}
									className="w-full"
								/>
								<div className="flex justify-between text-sm text-muted-foreground">
									<span>20 (Minimum)</span>
									<span>50 (Top)</span>
								</div>
							</div>
							<div className="mt-8 p-4 bg-muted rounded-lg">
								<p className="text-sm">
									<strong>💡 Tip:</strong> Most universities require at least
									23-27 APS for admission. Medicine and Engineering typically
									need 35+.
								</p>
							</div>
						</div>
					)}

					{step === 3 && (
						<div>
							<h2 className="text-2xl font-bold mb-2">Daily Study Time</h2>
							<p className="text-muted-foreground mb-6">
								How much time can you commit to studying each day?
							</p>
							<div className="text-center mb-8">
								<div className="text-6xl font-bold text-primary mb-2">
									{dailyMinutes}
								</div>
								<p className="text-muted-foreground">minutes per day</p>
							</div>
							<div className="space-y-4">
								<input
									type="range"
									min="10"
									max="120"
									step="10"
									value={dailyMinutes}
									onChange={(e) => setDailyMinutes(parseInt(e.target.value))}
									className="w-full"
								/>
								<div className="flex justify-between text-sm text-muted-foreground">
									<span>10 min</span>
									<span>120 min</span>
								</div>
							</div>
							<div className="mt-8 grid grid-cols-3 gap-2 text-center">
								<Button
									variant={dailyMinutes === 15 ? "default" : "outline"}
									size="sm"
									onClick={() => setDailyMinutes(15)}
								>
									15 min
								</Button>
								<Button
									variant={dailyMinutes === 30 ? "default" : "outline"}
									size="sm"
									onClick={() => setDailyMinutes(30)}
								>
									30 min
								</Button>
								<Button
									variant={dailyMinutes === 60 ? "default" : "outline"}
									size="sm"
									onClick={() => setDailyMinutes(60)}
								>
									60 min
								</Button>
							</div>
						</div>
					)}

					{step === 4 && (
						<div>
							<h2 className="text-2xl font-bold mb-2">Stay Connected</h2>
							<p className="text-muted-foreground mb-6">
								Enable notifications to get study reminders and track your
								progress.
							</p>
							<Card className={notifications ? "ring-2 ring-primary" : ""}>
								<CardContent className="p-4">
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
								</CardContent>
							</Card>
							<div className="mt-6 p-4 bg-muted rounded-lg">
								<p className="text-sm text-muted-foreground">
									You can change this anytime in Settings → Notifications.
								</p>
							</div>
						</div>
					)}
				</div>

				<div className="flex items-center justify-between mt-8 pt-4 border-t">
					<div>
						{step > 0 && (
							<Button variant="ghost" onClick={handleBack}>
								<ArrowLeft className="mr-2 h-4 w-4" />
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
							<ArrowRight className="ml-2 h-4 w-4" />
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
