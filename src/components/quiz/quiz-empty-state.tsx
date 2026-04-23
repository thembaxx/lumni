"use client";

import { PuzzleIcon, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";

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
		<Empty className="border border-dashed mt-24">
			<EmptyHeader>
				<EmptyMedia variant="icon">
					<PuzzleIcon />
				</EmptyMedia>
				<EmptyTitle>Quiz not started</EmptyTitle>
				<EmptyDescription>
					Practice quizzes you start will be saved here for easy access later.
					You can also view and manage your past quiz attempts here.
				</EmptyDescription>
			</EmptyHeader>
			<EmptyContent>
				<Button variant="outline" size="sm" onClick={onStart}>
					Start quiz
				</Button>
			</EmptyContent>
		</Empty>
	);
}

function QuizEmptyStateNoQuestions({
	subject,
	onBack,
}: QuizEmptyStateNoQuestionsProps) {
	return (
		<Empty>
			<EmptyHeader>
				<EmptyMedia variant="icon">
					<Target className="size-8" />
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
		</Empty>
	);
}

interface QuizStartStateProps {
	onSelect: () => void;
}

export function QuizStartState({ onSelect }: QuizStartStateProps) {
	return (
		<div className="mt-24 flex flex-col items-center gap-4 animate-fade-in-scale">
			<div className="relative flex items-center justify-center">
				<div className="absolute size-20 rounded-full bg-muted/40 animate-pulse" />
				<div className="relative flex items-center justify-center size-20 rounded-full border border-dashed border-muted-foreground/20 bg-muted/20">
					<PuzzleIcon className="size-8 text-muted-foreground/40" />
				</div>
			</div>
			<div className="text-center space-y-1.5">
				<p className="text-sm font-medium text-muted-foreground">
					Select a subject to begin
				</p>
				<p className="text-xs text-muted-foreground/60">
					Choose a subject above to start your quiz
				</p>
			</div>
			<div className="flex items-center gap-1.5">
				<span
					className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40"
					style={{ animation: "pulse-dot 1s ease-out infinite" }}
				/>
				<span
					className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40"
					style={{ animation: "pulse-dot 1s ease-out infinite 150ms" }}
				/>
				<span
					className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40"
					style={{ animation: "pulse-dot 1s ease-out infinite 300ms" }}
				/>
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
		<div className="mt-24 flex flex-col items-center gap-4 animate-fade-in-scale">
			<div className="relative flex items-center justify-center">
				<div className="absolute size-20 rounded-full bg-muted/40 animate-pulse" />
				<div className="relative flex items-center justify-center size-20 rounded-full border border-dashed border-muted-foreground/20 bg-muted/20">
					<PuzzleIcon className="size-8 text-muted-foreground/40" />
				</div>
			</div>
			<div className="text-center space-y-1.5">
				<p className="text-sm font-medium text-muted-foreground">
					{hasSubject ? "Ready to begin" : "Select a subject to begin"}
				</p>
				<p className="text-xs text-muted-foreground/60">
					{hasSubject
						? "Press play to start your quiz"
						: "Choose a subject above to start your quiz"}
				</p>
			</div>
			<div className="flex items-center gap-1.5">
				<span
					className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40"
					style={{ animation: "pulse-dot 1s ease-out infinite" }}
				/>
				<span
					className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40"
					style={{ animation: "pulse-dot 1s ease-out infinite 150ms" }}
				/>
				<span
					className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40"
					style={{ animation: "pulse-dot 1s ease-out infinite 300ms" }}
				/>
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
		<Empty>
			<EmptyHeader>
				<EmptyMedia variant="icon">
					<Target className="size-8" />
				</EmptyMedia>
				<EmptyTitle>Start a Quiz</EmptyTitle>
				<EmptyDescription>
					Select a subject to begin practicing
				</EmptyDescription>
			</EmptyHeader>
			<EmptyContent>
				<Button onClick={() => onSelect("")}>{buttonLabel}</Button>
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
