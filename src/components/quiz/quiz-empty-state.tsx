"use client";

import { useTranslations } from "next-intl";
import { RadialIcon, Target01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { m } from "framer-motion";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
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
	const t = useTranslations();
	return (
		<Empty className="mt-2 border border-dashed">
			<div className="grid grid-cols-12 items-center gap-4">
				<div className="col-span-12 md:col-span-6">
					<EmptyHeader>
						<EmptyMedia variant="icon">
							<m.div
								animate={{ rotate: 360 }}
								transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
							>
								<HugeiconsIcon
									icon={RadialIcon}
									className="mx-auto size-12 text-muted-foreground md:mx-0"
								/>
							</m.div>
						</EmptyMedia>
						<EmptyTitle>{t("quiz.notStarted")}</EmptyTitle>
						<EmptyDescription>
							{t("quiz.notStartedDesc")}
						</EmptyDescription>
					</EmptyHeader>
					<EmptyContent>
						<Button variant="outline" size="sm" onClick={onStart}>
							{t("quiz.startQuiz")}
						</Button>
					</EmptyContent>
				</div>
				<div className="col-span-12 hidden md:col-span-6 md:block">
					<div className="h-48 w-full animate-float-slow rounded-3xl bg-muted/40" />
				</div>
			</div>
		</Empty>
	);
}

function QuizEmptyStateNoQuestions({
	subject,
	onBack,
}: QuizEmptyStateNoQuestionsProps) {
	const t = useTranslations();
	return (
		<Empty>
			<div className="grid grid-cols-12 items-center gap-4">
				<div className="col-span-12 md:col-span-6">
					<EmptyHeader>
						<EmptyMedia variant="icon">
							<m.div
								animate={{ rotate: 360 }}
								transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
							>
								<HugeiconsIcon
									icon={RadialIcon}
									className="mx-auto size-12 text-muted-foreground md:mx-0"
								/>
							</m.div>
						</EmptyMedia>
						<EmptyTitle>{t("quiz.noQuestionsFound")}</EmptyTitle>
						<EmptyDescription>
							{t("quiz.uploadQuestions", { subject: subject ?? "" })}
						</EmptyDescription>
					</EmptyHeader>
					<EmptyContent>
						<Button variant="outline" onClick={onBack}>
							{t("common.back")}
						</Button>
					</EmptyContent>
				</div>
				<div className="col-span-12 hidden md:col-span-6 md:block">
					<div className="h-48 w-full animate-float-slow rounded-3xl bg-destructive/10" />
				</div>
			</div>
		</Empty>
	);
}

interface QuizStartStateProps {
	onSelect: () => void;
}

export function QuizStartState({ onSelect }: QuizStartStateProps) {
	const t = useTranslations();
	return (
		<div className="mt-24 flex flex-col gap-4">
			<div className="grid grid-cols-12 items-center gap-4">
				<div className="col-span-12 md:col-span-6">
					<div className="flex flex-col gap-4 text-center md:text-left">
						<p className="font-medium text-muted-foreground text-sm">
							{t("quiz.selectSubjectBegin")}
						</p>
						<p className="text-muted-foreground/60 text-xs">
							{t("quiz.chooseSubjectToStart")}
						</p>
					</div>
				</div>
				<div className="col-span-12 flex justify-center md:col-span-6">
					<div className="relative">
						<Skeleton shape="circle" className="absolute size-20" />
						<div className="relative flex size-20 items-center justify-center rounded-full border border-muted-foreground/20 border-dashed bg-muted/20">
							<m.div
								animate={{ rotate: 360 }}
								transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
							>
								<HugeiconsIcon
									icon={RadialIcon}
									className="size-12 text-muted-foreground"
								/>
							</m.div>
						</div>
					</div>
				</div>
			</div>
			<div className="flex justify-center md:justify-start">
				<button
					type="button"
					onClick={onSelect}
					className="rounded-lg bg-system-accent px-4 py-2 font-medium text-sm text-white hover:bg-system-accent/90"
				>
					{t("quiz.selectSubject")}
				</button>
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
	const t = useTranslations();
	return (
		<div className="mt-24 flex flex-col gap-4">
			<div className="grid grid-cols-12 items-center gap-4">
				<div className="col-span-12 md:col-span-6">
					<div className="flex flex-col gap-4 text-center md:text-left">
						<p className="font-medium text-muted-foreground text-sm">
							{hasSubject ? t("quiz.readyToBegin") : t("quiz.selectSubjectBegin")}
						</p>
						<p className="text-muted-foreground/60 text-xs">
							{hasSubject
								? t("quiz.pressPlayToStart")
								: t("quiz.chooseSubjectToStart")}
						</p>
					</div>
				</div>
				<div className="col-span-12 flex justify-center md:col-span-6">
					<div className="relative">
						<Skeleton shape="circle" className="absolute size-20" />
						<div className="relative flex size-20 items-center justify-center rounded-full border border-muted-foreground/20 border-dashed bg-muted/20">
							<m.div
								animate={{ rotate: 360 }}
								transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
							>
								<HugeiconsIcon
									icon={RadialIcon}
									className="size-12 text-muted-foreground"
								/>
							</m.div>
						</div>
					</div>
				</div>
			</div>
			<div className="flex justify-center md:justify-start">
				<button
					type="button"
					onClick={onSelect}
					className="rounded-lg bg-system-accent px-4 py-2 font-medium text-sm text-white hover:bg-system-accent/90"
				>
					{hasSubject ? t("quiz.startQuiz") : t("quiz.selectSubject")}
				</button>
			</div>
		</div>
	);
}

export function QuizSelectSubject({
	onSelect,
	buttonLabel: _buttonLabel = "Choose Subject",
}: {
	onSelect: (subject: string) => void;
	buttonLabel?: string;
}) {
	const t = useTranslations();
	return (
		<Empty className="p-0">
			<EmptyHeader>
				<EmptyMedia variant="icon">
					<HugeiconsIcon icon={Target01Icon} className="size-8" />
				</EmptyMedia>
				<EmptyTitle>{t("quiz.startQuiz")}</EmptyTitle>
				<EmptyDescription>
					{t("quiz.selectSubjectToBegin")}
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
		default:
			return <QuizEmptyStateNotStarted onStart={onStart} />;
	}
}
