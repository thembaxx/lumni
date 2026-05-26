"use client";

import {
	BookOpen01Icon,
	CheckmarkCircle01Icon,
	Delete01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { LocalDataNotice } from "@/components/shared/local-data-notice";
import { DiscussWrongAnswer } from "@/components/study-groups/discuss-wrong-answer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useSubjects } from "@/hooks/use-subjects";
import {
	ERROR_TYPE_LABELS,
	type ErrorType,
	useWrongAnswerJournal,
} from "@/hooks/use-wrong-answer-journal";
import { Link } from "@/i18n/navigation";

function ErrorTypeSelect({
	value,
	onChange,
}: {
	value: string;
	onChange: (v: ErrorType) => void;
}) {
	return (
		<Select value={value} onValueChange={(v) => v && onChange(v as ErrorType)}>
			<SelectTrigger className="h-8 w-[180px] text-xs">
				<SelectValue placeholder="Error type" />
			</SelectTrigger>
			<SelectContent>
				{Object.entries(ERROR_TYPE_LABELS).map(([key, label]) => (
					<SelectItem key={key} value={key}>
						{label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}

export default function ReviewPage() {
	const { getWrongAnswers, markReviewed, clearReviewed, updateErrorType } =
		useWrongAnswerJournal();
	const { data: subjectsData } = useSubjects();
	const subjects = subjectsData?.subjects ?? [];
	const [filterSubject, setFilterSubject] = useState<string>("");
	const [filterTopic, setFilterTopic] = useState<string>("");
	const [errorTypes, setErrorTypes] = useState<Record<number, ErrorType>>({});

	const { data: entries = [], isLoading: loading } = useQuery({
		queryKey: ["wrong-answers", filterSubject, filterTopic],
		queryFn: () =>
			getWrongAnswers(filterSubject || undefined, filterTopic || undefined),
	});

	const uniqueTopics = useMemo(() => {
		const topics = new Set(entries.map((e) => e.topic));
		return Array.from(topics).filter(Boolean).sort();
	}, [entries]);

	const handleReviewed = async (id: number) => {
		await markReviewed(id);
		refreshEntries();
	};

	const queryClient = useQueryClient();

	const refreshEntries = () => {
		queryClient.invalidateQueries({ queryKey: ["wrong-answers"] });
	};

	const handleClearReviewed = async () => {
		await clearReviewed();
		refreshEntries();
	};

	const handleErrorTypeChange = async (entryId: number, type: ErrorType) => {
		setErrorTypes((prev) => ({ ...prev, [entryId]: type }));
		await updateErrorType(entryId, type);
	};

	if (loading) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background">
				<p className="animate-pulse text-muted-foreground">Loading…</p>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-system-grouped pt-4 pb-24">
			<PageContainer className="flex flex-col gap-6">
				<LocalDataNotice
					page="review"
					description="Your mistake journal is stored on this device. Sign in to access your review history from any device."
				/>
				<div className="flex items-center justify-between">
					<h1 className="ios-title-1 font-semibold text-foreground tracking-tight">
						Wrong Answer Journal
					</h1>
					<div className="flex items-center gap-2">
						{filterSubject && (
							<Link
								href={`/quiz?subject=${encodeURIComponent(filterSubject)}${filterTopic ? `&topic=${encodeURIComponent(filterTopic)}` : ""}&count=10`}
							>
								<Button size="sm">Practice these topics</Button>
							</Link>
						)}
						{entries.length > 0 && (
							<Button variant="ghost" size="sm" onClick={handleClearReviewed}>
								<HugeiconsIcon icon={Delete01Icon} data-icon="inline-start" />
								Clear reviewed
							</Button>
						)}
					</div>
				</div>

				<div className="flex flex-wrap gap-3">
					<Select
						value={filterSubject || "__all__"}
						onValueChange={(v) => {
							if (!v) return;
							setFilterSubject(v === "__all__" ? "" : v);
							setFilterTopic("");
						}}
					>
						<SelectTrigger className="w-[160px]">
							<SelectValue placeholder="All subjects" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="__all__">All subjects</SelectItem>
							{subjects?.map((s) => (
								<SelectItem key={s.name} value={s.name}>
									{s.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					{uniqueTopics.length > 0 && (
						<Select
							value={filterTopic || "__all__"}
							onValueChange={(v) => {
								if (!v) return;
								setFilterTopic(v === "__all__" ? "" : v);
							}}
						>
							<SelectTrigger className="w-[160px]">
								<SelectValue placeholder="All topics" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="__all__">All topics</SelectItem>
								{uniqueTopics.map((t) => (
									<SelectItem key={t} value={t}>
										{t}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					)}
				</div>

				{entries.length === 0 ? (
					<Card>
						<CardContent className="p-8 text-center">
							<HugeiconsIcon
								icon={BookOpen01Icon}
								className="mx-auto mb-3 size-8 text-muted-foreground/40"
							/>
							<p className="font-semibold text-base">No mistakes to review</p>
							<p className="mt-1 text-muted-foreground text-sm">
								{filterSubject
									? `No mistakes found for ${filterSubject}.`
									: "Wrong answers will appear here automatically after quizzes and exams."}
							</p>
							{filterSubject && (
								<div className="mt-4">
									<Link
										href={`/quiz?subject=${encodeURIComponent(filterSubject)}${filterTopic ? `&topic=${encodeURIComponent(filterTopic)}` : ""}&count=10`}
									>
										<Button size="sm" variant="outline">
											Practice {filterSubject}
										</Button>
									</Link>
								</div>
							)}
						</CardContent>
					</Card>
				) : (
					<div className="flex flex-col gap-3">
						<p className="text-muted-foreground text-sm">
							{entries.length} question{entries.length !== 1 ? "s" : ""} to
							review
						</p>
						{entries.map((entry) => (
							<Card key={entry.id}>
								<CardHeader className="pb-2">
									<div className="flex flex-wrap items-center gap-2">
										<Badge variant="outline">{entry.subject}</Badge>
										<Badge variant="secondary" className="text-xs">
											{entry.topic}
										</Badge>
										<ErrorTypeSelect
											value={
												errorTypes[entry.id ?? 0] ??
												entry.errorType ??
												"unknown"
											}
											onChange={(v) => handleErrorTypeChange(entry.id ?? 0, v)}
										/>
									</div>
									<CardTitle className="mt-2 font-semibold text-base">
										<MarkdownRenderer content={entry.questionText} />
									</CardTitle>
								</CardHeader>
								<CardContent className="flex flex-col gap-3">
									<div className="grid grid-cols-2 gap-3">
										<div className="rounded-lg bg-destructive/5 p-3">
											<p className="mb-1 font-medium text-destructive text-xs">
												Your answer
											</p>
											<p className="text-sm">{entry.userAnswer}</p>
										</div>
										<div className="rounded-lg bg-success/5 p-3">
											<p className="mb-1 font-medium text-success text-xs">
												Correct answer
											</p>
											<p className="text-sm">{entry.correctAnswer}</p>
										</div>
									</div>
									{entry.explanation && (
										<div className="rounded-lg bg-muted/30 p-3 text-sm">
											<MarkdownRenderer content={entry.explanation} />
										</div>
									)}
									<div className="flex items-center justify-end gap-2">
										<DiscussWrongAnswer
											questionText={entry.questionText}
											subject={entry.subject}
											topic={entry.topic}
										/>
										{entry.id && (
											<Button
												variant="outline"
												size="sm"
												onClick={() => handleReviewed(entry.id ?? 0)}
											>
												<HugeiconsIcon
													icon={CheckmarkCircle01Icon}
													data-icon="inline-start"
												/>
												Mark reviewed
											</Button>
										)}
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				)}
			</PageContainer>
		</div>
	);
}
