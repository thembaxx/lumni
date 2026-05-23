"use client";

import {
	BookOpen01Icon,
	HeadphonesIcon,
	WifiOff01Icon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { cva, type VariantProps } from "class-variance-authority";
import { m } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/shared";
import { AnimatedIcon } from "@/lib/utils/icon-mapping";

/* ─── Subcomponents (from @/components/ui/empty) ─── */

function Empty({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="empty"
			className={cn(
				"flex w-full min-w-0 flex-1 flex-col items-center justify-center gap-4 text-balance rounded-xl border-dashed p-6 text-center",
				className,
			)}
			{...props}
		/>
	);
}

function EmptyHeader({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="empty-header"
			className={cn("flex max-w-sm flex-col items-center gap-1", className)}
			{...props}
		/>
	);
}

const emptyMediaVariants = cva(
	"mb-2 flex shrink-0 items-center justify-center [&_svg]:pointer-events-none [&_svg]:shrink-0",
	{
		variants: {
			variant: {
				default: "bg-transparent",
				icon: "flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-foreground [&_svg:not([class*='size-'])]:size-4",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

interface EmptyMediaProps
	extends React.ComponentProps<"div">,
		VariantProps<typeof emptyMediaVariants> {}

function EmptyMedia({
	className,
	variant = "default",
	...props
}: EmptyMediaProps) {
	return (
		<div
			data-slot="empty-icon"
			data-variant={variant}
			className={cn(emptyMediaVariants({ variant, className }))}
			{...props}
		/>
	);
}

function EmptyTitle({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="empty-title"
			className={cn(
				"font-heading font-medium text-sm tracking-tight",
				className,
			)}
			{...props}
		/>
	);
}

function EmptyDescription({ className, ...props }: React.ComponentProps<"p">) {
	return (
		<div
			data-slot="empty-description"
			className={cn(
				"text-muted-foreground text-xs/relaxed [&>a:hover]:text-primary [&>a]:underline [&>a]:underline-offset-4",
				className,
			)}
			{...props}
		/>
	);
}

function EmptyContent({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="empty-content"
			className={cn(
				"flex w-full min-w-0 max-w-sm flex-col items-center gap-2 text-balance text-xs/relaxed",
				className,
			)}
			{...props}
		/>
	);
}

/* ─── EmptyState (wrapper with icon, title, description, action) ─── */

interface EmptyStateProps {
	icon?: IconSvgElement;
	title: string;
	description?: string;
	action?: React.ReactNode;
	overlay?: boolean;
	className?: string;
}

export function EmptyState({
	icon,
	title,
	description,
	action,
	overlay,
	className,
}: EmptyStateProps) {
	return (
		<div
			className={cn(
				"flex h-full items-center justify-center",
				overlay &&
					"absolute inset-0 z-sticky bg-background/90 backdrop-blur-sm",
				className,
			)}
		>
			<Empty>
				<EmptyHeader>
					{icon && (
						<HugeiconsIcon
							icon={icon}
							className="mx-auto size-10 text-muted-foreground/30"
						/>
					)}
					<EmptyTitle>{title}</EmptyTitle>
				</EmptyHeader>
				<EmptyContent>
					{description && <EmptyDescription>{description}</EmptyDescription>}
					{action && action}
				</EmptyContent>
			</Empty>
		</div>
	);
}

/* ─── EmptyStateWithIllustration (from @/components/empty-states) ─── */

interface EmptyStateWithIllustrationProps {
	icon?: IconSvgElement;
	title: string;
	description: string;
	action?: { label: string; onClick: () => void };
	secondaryAction?: { label: string; onClick: () => void };
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
	icon,
	title,
	description,
	action,
	secondaryAction,
	animation,
}: EmptyStateWithIllustrationProps) {
	return (
		<div className="flex flex-col items-center justify-center px-4 py-16 text-center">
			<div className="relative mb-6">
				<div className="absolute inset-0 rounded-full bg-muted/50 blur-xl" />
				<div className="relative flex size-20 items-center justify-center rounded-full border border-muted-foreground/30 border-dashed bg-muted/30">
					{animation ? (
						<AnimatedIllustration animation={animation} />
					) : icon ? (
						<HugeiconsIcon
							icon={icon}
							className="size-8 text-muted-foreground/60"
						/>
					) : null}
				</div>
			</div>
			<h3 className="balance mb-2 w-full text-wrap text-center font-semibold text-xl">
				{title}
			</h3>
			<p className="mb-6 max-w-md text-muted-foreground text-sm">
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

/* ─── EmptyStates presets ─── */

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
			icon={BookOpen01Icon}
			title="No Topics Available"
			description="Topics will appear here once questions are uploaded for this subject."
		/>
	),

	offline: (onRetry?: () => void) => (
		<EmptyState
			icon={WifiOff01Icon}
			title="You're Offline"
			description="Check your internet connection and try again. Your progress will sync when you're back online."
			action={
				onRetry ? <Button onClick={onRetry}>Try Again</Button> : undefined
			}
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
			icon={HeadphonesIcon}
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
		<div className="flex flex-col items-center justify-center px-4 py-12 text-center">
			<m.div
				animate={{ rotate: 360 }}
				transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
				className="mb-4 size-16"
			>
				<AnimatedIcon name="loading-lumni" className="size-16" />
			</m.div>
			<h3 className="mb-2 font-semibold text-lg">Just a moment</h3>
			<p className="max-w-sm text-muted-foreground text-sm">
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

export {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
};
