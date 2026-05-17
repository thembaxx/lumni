"use client";

import {
	BookOpen,
	ChatCenteredText,
	CloudArrowUp,
	Headphones,
	Icon,
	UploadSimple,
	WifiHigh,
	WifiSlash,
} from "@phosphor-icons/react";
import { m } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/shared";
import { AnimatedIcon } from "@/lib/utils/icon-mapping";

interface EmptyStateProps {
	icon: Icon;
	title: string;
	description: string;
	action?: {
		label: string;
		onClick: () => void;
	};
	secondaryAction?: {
		label: string;
		onClick: () => void;
	};
	className?: string;
}

export function EmptyState({
	icon: Icon,
	title,
	description,
	action,
	secondaryAction,
	className,
}: EmptyStateProps) {
	return (
		<div
			className={cn(
				"flex flex-col items-center justify-center py-12 px-4 text-center",
				className,
			)}
		>
			<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
				<Icon className="h-6 w-6 text-muted-foreground" />
			</div>
			<h3 className="mb-2 text-lg font-semibold text-wrap balance">{title}</h3>
			<p className="mb-4 max-w-sm text-sm text-muted-foreground">
				{description}
			</p>
			<div className="flex gap-2">
				{action && (
					<Button onClick={action.onClick} size="sm">
						{action.label}
					</Button>
				)}
				{secondaryAction && (
					<Button variant="outline" onClick={secondaryAction.onClick} size="sm">
						{secondaryAction.label}
					</Button>
				)}
			</div>
		</div>
	);
}

interface EmptyStateWithIllustrationProps {
	icon?: Icon;
	title: string;
	description: string;
	action?: {
		label: string;
		onClick: () => void;
	};
	secondaryAction?: {
		label: string;
		onClick: () => void;
	};
	animation?: "search" | "upload" | "error";
}

function AnimatedIllustration({
	animation,
}: {
	animation: "search" | "upload" | "error";
}) {
	const animationMap: Record<string, string> = {
		search: "empty-search",
		upload: "empty-upload",
		error: "error-state",
	};
	return <AnimatedIcon name={animationMap[animation]} className="size-14" />;
}

export function EmptyStateWithIllustration({
	icon: Icon,
	title,
	description,
	action,
	secondaryAction,
	animation,
}: EmptyStateWithIllustrationProps) {
	return (
		<div className="flex flex-col items-center justify-center py-16 px-4 text-center">
			<div className="relative mb-6">
				<div className="absolute inset-0 rounded-full bg-muted/50 blur-xl" />
				<div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-dashed border-muted-foreground/30 bg-muted/30">
					{animation ? (
						<AnimatedIllustration animation={animation} />
					) : Icon ? (
						<Icon className="h-8 w-8 text-muted-foreground/60" />
					) : null}
				</div>
			</div>
			<h3 className="mb-2 text-xl font-semibold text-wrap balance">{title}</h3>
			<p className="mb-6 max-w-md text-sm text-muted-foreground">
				{description}
			</p>
			<div className="flex gap-2">
				{secondaryAction && (
					<Button variant="outline" onClick={secondaryAction.onClick}>
						{secondaryAction.label}
					</Button>
				)}
				{action && <Button onClick={action.onClick}>{action.label}</Button>}
			</div>
		</div>
	);
}

export const EmptyStates = {
	noQuestions: (onAction?: () => void) => (
		<EmptyStateWithIllustration
			animation="search"
			title="No Questions Available"
			description="There are no questions for this subject yet. Upload questions or select a different subject to practice."
			action={
				onAction ? { label: "Upload Questions", onClick: onAction } : undefined
			}
		/>
	),

	noFlashcards: (onAction?: () => void) => (
		<EmptyStateWithIllustration
			animation="upload"
			title="No Flashcards Yet"
			description="Create flashcards from your quiz questions or start a study session to build your deck."
			action={
				onAction ? { label: "Create Flashcards", onClick: onAction } : undefined
			}
		/>
	),

	noExamPapers: (onAction?: () => void) => (
		<EmptyStateWithIllustration
			animation="upload"
			title="No Exam Papers"
			description="Upload exam papers to practice with past questions and prepare for your exams."
			action={
				onAction ? { label: "Upload Exam Paper", onClick: onAction } : undefined
			}
		/>
	),

	noProgress: () => (
		<EmptyStateWithIllustration
			animation="search"
			title="Start Your Learning Journey"
			description="Complete quizzes and study sessions to track your progress and see your achievements."
			action={{
				label: "Start Quiz",
				onClick: () => (window.location.href = "/quiz"),
			}}
		/>
	),

	noTopics: () => (
		<EmptyState
			icon={BookOpen}
			title="No Topics Available"
			description="Topics will appear here once questions are uploaded for this subject."
		/>
	),

	offline: (onRetry?: () => void) => (
		<EmptyState
			icon={WifiSlash}
			title="You're Offline"
			description="Check your internet connection and try again. Your progress will sync when you're back online."
			action={onRetry ? { label: "Try Again", onClick: onRetry } : undefined}
		/>
	),

	noSubjects: () => (
		<EmptyStateWithIllustration
			animation="search"
			title="No Subjects Selected"
			description="Choose subjects you want to study to get personalized practice questions and track your progress."
			action={{
				label: "Browse Subjects",
				onClick: () => (window.location.href = "/dashboard"),
			}}
		/>
	),

	noRecording: () => (
		<EmptyState
			icon={Headphones}
			title="No Recordings Yet"
			description="Record your voice to practice pronunciation or create audio notes."
		/>
	),

	searchNoResults: (query: string) => (
		<EmptyStateWithIllustration
			animation="search"
			title="No Results Found"
			description={`We couldn't find anything matching "${query}". Try different keywords or browse categories.`}
		/>
	),

	uploadFailed: (onRetry?: () => void) => (
		<EmptyStateWithIllustration
			animation="error"
			title="Upload Failed"
			description="There was a problem uploading your file. Please try again or check the file format."
			action={onRetry ? { label: "Try Again", onClick: onRetry } : undefined}
		/>
	),

	loadingSlow: (task = "Loading your data") => (
		<div className="flex flex-col items-center justify-center py-12 px-4 text-center">
			<m.div
				animate={{ rotate: 360 }}
				transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
				className="size-16 mb-4"
			>
				<AnimatedIcon name="loading-lumni" className="size-16" />
			</m.div>
			<h3 className="mb-2 text-lg font-semibold">Just a moment</h3>
			<p className="max-w-sm text-sm text-muted-foreground">
				{task}. This usually takes a few seconds.
			</p>
		</div>
	),

	error: (message: string, onRetry?: () => void) => (
		<EmptyStateWithIllustration
			animation="error"
			title="Something Went Wrong"
			description={message}
			action={onRetry ? { label: "Try Again", onClick: onRetry } : undefined}
		/>
	),

	getStarted: (onStartQuiz?: () => void, onBrowse?: () => void) => (
		<EmptyStateWithIllustration
			animation="search"
			title="Ready to Start?"
			description="You're all set up! Begin your study session now or explore subjects and topics."
			action={
				onStartQuiz ? { label: "Start Quiz", onClick: onStartQuiz } : undefined
			}
			secondaryAction={
				onBrowse ? { label: "Browse Subjects", onClick: onBrowse } : undefined
			}
		/>
	),

	interruptedQuiz: (onResume?: () => void) => (
		<EmptyStateWithIllustration
			animation="search"
			title="Quiz Interrupted"
			description="You have an unfinished quiz. Would you like to continue where you left off?"
			action={
				onResume ? { label: "Resume Quiz", onClick: onResume } : undefined
			}
		/>
	),

	noDueCards: () => (
		<EmptyStateWithIllustration
			animation="search"
			title="All Caught Up"
			description="No flashcards due for review. Great job staying on top of your studies!"
			action={{
				label: "Add More Cards",
				onClick: () => (window.location.href = "/quiz"),
			}}
		/>
	),
};
