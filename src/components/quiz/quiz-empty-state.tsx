"use client";

import { Target } from "@phosphor-icons/react";
import { CircleNotch } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { AnimatedDots } from "@/components/shared/animated-dots";
import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { SubjectSelector } from "./subject-selector";

interface QuizEmptyStateProps {
	subject?: string;
	onStart?: () => void;
	onBack?: () => void;
	variant?: "not-started" | "no-questions";
}

interface QuizEmptyStateNotStartedProps {
	onStart?: () => void;
}

interface QuizEmptyStateNoQuestionsProps {
	subject?: string;
	onBack?: () => void;
}

function QuizEmptyStateNotStarted({ onStart }: QuizEmptyStateNotStartedProps) {
	return (
		<Empty className="border border-dashed mt-2">
			<div className="grid grid-cols-12 gap-4 items-center">
				<div className="col-span-12 md:col-span-6">
					<EmptyHeader>
						<EmptyMedia variant="icon">
							<motion.div
								animate={{ rotate: 360 }}
								transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
							>
								<CircleNotch className="size-12 mx-auto md:mx-0 text-muted-foreground" />
							</motion.div>
						</EmptyMedia>
						<EmptyTitle>Quiz not started</EmptyTitle>
						<EmptyDescription>
							Practice quizzes you start will be saved here for easy access
							later. You can also view and manage your past quiz attempts here.
						</EmptyDescription>
					</EmptyHeader>
					<EmptyContent>
						<Button variant="outline" size="sm" onClick={onStart}>
							Start quiz
						</Button>
					</EmptyContent>
				</div>
				<div className="col-span-12 md:col-span-6 hidden md:block">
					<div className="w-full h-48 rounded-3xl bg-muted/40 animate-float-slow" />
				</div>
			</div>
		</Empty>
	);
}

function QuizEmptyStateNoQuestions({
	subject,
	onBack,
}: QuizEmptyStateNoQuestionsProps) {
	return (
		<Empty>
			<div className="grid grid-cols-12 gap-4 items-center">
				<div className="col-span-12 md:col-span-6">
					<EmptyHeader>
						<EmptyMedia variant="icon">
							<motion.div
								animate={{ rotate: 360 }}
								transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
							>
								<CircleNotch className="size-12 mx-auto md:mx-0 text-muted-foreground" />
							</motion.div>
						</EmptyMedia>
						<EmptyTitle>No questions found</EmptyTitle>
						<EmptyDescription>
							Upload questions for {subject} to start practicing
						</EmptyDescription>
					</EmptyHeader>
					<EmptyContent>
						<Button variant="outline" onClick={onBack}>
							Go Back
						</Button>
					</EmptyContent>
				</div>
				<div className="col-span-12 md:col-span-6 hidden md:block">
					<div className="w-full h-48 rounded-3xl bg-destructive/10 animate-float-slow" />
				</div>
			</div>
		</Empty>
	);
}

interface QuizStartStateProps {
	onSelect: () => void;
}

export function QuizStartState({ onSelect }: QuizStartStateProps) {
	return (
		<div className="mt-24 flex flex-col gap-4">
			<div className="grid grid-cols-12 gap-4 items-center">
				<div className="col-span-12 md:col-span-6">
					<div className="flex flex-col gap-4 text-center md:text-left">
						<p className="text-sm font-medium text-muted-foreground">
							Select a subject to begin
						</p>
						<p className="text-xs text-muted-foreground/60">
							Choose a subject above to start your quiz
						</p>
					</div>
				</div>
				<div className="col-span-12 md:col-span-6 flex justify-center">
					<div className="relative">
						<Skeleton shape="circle" className="absolute size-20" />
						<div className="relative flex items-center justify-center size-20 rounded-full border border-dashed border-muted-foreground/20 bg-muted/20">
							<motion.div
								animate={{ rotate: 360 }}
								transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
							>
								<CircleNotch className="size-12 text-muted-foreground" />
							</motion.div>
						</div>
					</div>
				</div>
			</div>
			<div className="flex justify-center md:justify-start">
				<AnimatedDots />
			</div>
		</div>
	);
}

interface QuizSubjectPromptProps {
	onSelect: () => void;
	hasSubject?: boolean;
}

export function QuizSubjectPrompt({
	onSelect,
	hasSubject,
}: QuizSubjectPromptProps) {
	return (
		<div className="mt-24 flex flex-col gap-4">
			<div className="grid grid-cols-12 gap-4 items-center">
				<div className="col-span-12 md:col-span-6">
					<div className="flex flex-col gap-4 text-center md:text-left">
						<p className="text-sm font-medium text-muted-foreground">
							{hasSubject ? "Ready to begin" : "Select a subject to begin"}
						</p>
						<p className="text-xs text-muted-foreground/60">
							{hasSubject
								? "Press play to start your quiz"
								: "Choose a subject above to start your quiz"}
						</p>
					</div>
				</div>
				<div className="col-span-12 md:col-span-6 flex justify-center">
					<div className="relative">
						<Skeleton shape="circle" className="absolute size-20" />
						<div className="relative flex items-center justify-center size-20 rounded-full border border-dashed border-muted-foreground/20 bg-muted/20">
							<motion.div
								animate={{ rotate: 360 }}
								transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
							>
								<CircleNotch className="size-12 text-muted-foreground" />
							</motion.div>
						</div>
					</div>
				</div>
			</div>
			<div className="flex justify-center md:justify-start">
				<AnimatedDots />
			</div>
		</div>
	);
}

export function QuizSelectSubject({
	onSelect,
	buttonLabel = "Choose Subject",
}: {
	onSelect: (subject: string) => void;
	buttonLabel?: string;
}) {
	return (
		<Empty className="p-0">
			<EmptyHeader>
				<EmptyMedia variant="icon">
					<Target className="size-8" />
				</EmptyMedia>
				<EmptyTitle>Start a Quiz</EmptyTitle>
				<EmptyDescription>
					Select a subject to begin practicing
				</EmptyDescription>
			</EmptyHeader>
			<EmptyContent className="px-0">
				<SubjectSelector onSelect={onSelect} />
			</EmptyContent>
		</Empty>
	);
}

export function QuizEmptyState({
	variant = "not-started",
	subject,
	onStart,
	onBack,
}: QuizEmptyStateProps) {
	switch (variant) {
		case "no-questions":
			return <QuizEmptyStateNoQuestions subject={subject} onBack={onBack} />;
		case "not-started":
		default:
			return <QuizEmptyStateNotStarted onStart={onStart} />;
	}
}