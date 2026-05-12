"use client";

import {
	ArrowRight,
	BookOpen,
	Check,
	GraduationCap,
	Target,
	X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ONBOARDING_STEPS = [
	{
		id: "welcome",
		title: "Welcome to Lumni",
		description:
			"Your personal AI-powered study companion for exam preparation",
		icon: GraduationCap,
	},
	{
		id: "quiz",
		title: "Practice with Quizzes",
		description:
			"Test your knowledge with adaptive quizzes that learn from your performance",
		icon: Target,
	},
	{
		id: "flashcards",
		title: "Master with Flashcards",
		description:
			"Create flashcards from wrong answers and review them using spaced repetition",
		icon: BookOpen,
	},
	{
		id: "exam-papers",
		title: "Real Exam Papers",
		description:
			"Practice with past exam papers and memos to prepare for the real thing",
		icon: BookOpen,
	},
];

const ONBOARDING_STORAGE_KEY = "lumni_onboarding_complete";

interface OnboardingProps {
	onComplete?: () => void;
}

function getInitialOnboardingState() {
	if (typeof window === "undefined") return false;
	return !!localStorage.getItem(ONBOARDING_STORAGE_KEY);
}

export function Onboarding({ onComplete }: OnboardingProps) {
	const [currentStep, setCurrentStep] = useState(0);
	const [isVisible, setIsVisible] = useState(getInitialOnboardingState);
	const [isAnimating, setIsAnimating] = useState(false);
	const router = useRouter();

	const handleComplete = useCallback(() => {
		setIsAnimating(true);
		setTimeout(() => {
			localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
			setIsVisible(false);
			onComplete?.();
		}, 300);
	}, [onComplete]);

	const handleNext = useCallback(() => {
		setIsAnimating(true);
		if (currentStep < ONBOARDING_STEPS.length - 1) {
			setTimeout(() => {
				setCurrentStep((prev) => prev + 1);
				setIsAnimating(false);
			}, 150);
		} else {
			handleComplete();
		}
	}, [currentStep, handleComplete]);

	const handleSkip = useCallback(() => {
		localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
		setIsVisible(false);
		onComplete?.();
	}, [onComplete]);

	const _handleAction = useCallback(
		(action: string) => {
			handleComplete();
			switch (action) {
				case "quiz":
					router.push("/quiz");
					break;
				case "flashcards":
					router.push("/flashcards");
					break;
				case "exams":
					router.push("/dashboard?tab=practice");
					break;
				default:
					router.push("/dashboard");
			}
		},
		[handleComplete, router],
	);

	if (!isVisible) return null;

	const step = ONBOARDING_STEPS[currentStep];
	const Icon = step.icon;
	const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			<div
				className={cn(
					"absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300",
					isAnimating ? "opacity-0" : "opacity-100",
				)}
				onClick={handleSkip}
			/>

			<div
				className={cn(
					"relative z-10 w-full max-w-md mx-4 overflow-hidden rounded-2xl bg-background shadow-2xl transition-transform duration-300",
					isAnimating
						? "scale-95 opacity-0 translate-y-4"
						: "scale-100 opacity-100 translate-y-0",
				)}
			>
				<Button
					variant="ghost"
					size="icon"
					onClick={handleSkip}
					className="absolute top-4 right-4 rounded-full hover:bg-muted"
					aria-label="Skip onboarding"
				>
					<X className="h-4 w-4" />
				</Button>

				<div className="p-8">
					<div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[--system-accent]/10">
						<Icon className="h-8 w-8 text-foreground" />
					</div>

					<h2 className="mb-2 text-2xl font-bold tracking-tight">
						{step.title}
					</h2>
					<p className="mb-8 text-muted-foreground">{step.description}</p>

					<div className="space-y-4">
						<div className="flex gap-2">
							{ONBOARDING_STEPS.map((_, idx) => (
								<div
									key={idx}
									className={cn(
										"h-1 flex-1 rounded-full transition-colors duration-300",
										idx <= currentStep ? "bg-[--system-accent]" : "bg-muted",
									)}
								/>
							))}
						</div>

						<div className="flex gap-3">
							<Button variant="outline" onClick={handleSkip} className="flex-1">
								Skip
							</Button>
							<Button onClick={handleNext} className="flex-1 gap-2">
								{isLastStep ? "Get Started" : "Next"}
								<ArrowRight className="h-4 w-4" />
							</Button>
						</div>
					</div>
				</div>

				<div className="border-t bg-muted/30 px-8 py-4">
					<p className="text-xs text-muted-foreground">
						Step {currentStep + 1} of {ONBOARDING_STEPS.length}
					</p>
				</div>
			</div>
		</div>
	);
}

export function OnboardingActionButtons() {
	const router = useRouter();

	return (
		<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
			<Button
				variant="outline"
				className="h-auto flex-col gap-2 py-4"
				onClick={() => router.push("/quiz")}
			>
				<Target className="h-5 w-5 text-foreground" />
				<span className="text-sm font-medium">Start Quiz</span>
			</Button>
			<Button
				variant="outline"
				className="h-auto flex-col gap-2 py-4"
				onClick={() => router.push("/flashcards")}
			>
				<BookOpen className="h-5 w-5 text-foreground" />
				<span className="text-sm font-medium">Flashcards</span>
			</Button>
			<Button
				variant="outline"
				className="h-auto flex-col gap-2 py-4"
				onClick={() => router.push("/dashboard?tab=practice")}
			>
				<GraduationCap className="h-5 w-5 text-foreground" />
				<span className="text-sm font-medium">Exam Papers</span>
			</Button>
		</div>
	);
}

export function isOnboardingComplete(): boolean {
	if (typeof window === "undefined") return true;
	return localStorage.getItem(ONBOARDING_STORAGE_KEY) === "true";
}

export function resetOnboarding(): void {
	localStorage.removeItem(ONBOARDING_STORAGE_KEY);
}
