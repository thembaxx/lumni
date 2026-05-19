"use client";

import {
	BookOpen01Icon,
	CheckmarkCircle01Icon,
	Delete01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo, useState } from "react";
import { MarkdownRenderer } from "@/components/markdown-renderer";
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
	type WrongAnswerEntry,
} from "@/hooks/use-wrong-answer-journal";

function ErrorTypeSelect({
	value,
	onChange,
}: {
	value: string;
	onChange: (v: ErrorType) => void;
}) {
	return (
		<Select value={value} onValueChange={(v) => v && onChange(v as ErrorType)}>
			<SelectTrigger className="w-[180px] h-8 text-xs">
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
	const { getWrongAnswers, markReviewed, clearReviewed } =
		useWrongAnswerJournal();
	const { data: subjects } = useSubjects();
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

	const handleErrorTypeChange = (entryId: number, type: ErrorType) => {
		setErrorTypes((prev) => ({ ...prev, [entryId]: type }));
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<p className="text-muted-foreground animate-pulse">Loading...</p>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-system-grouped pt-4 pb-24">
			<div className="max-w-3xl mx-auto w-full px-4 flex flex-col gap-6">
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

				<div className="flex gap-3 flex-wrap">
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
								className="size-8 text-muted-foreground/40 mx-auto mb-3"
							/>
							<p className="text-base font-semibold">No mistakes to review</p>
							<p className="text-sm text-muted-foreground mt-1">
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
						<p className="text-sm text-muted-foreground">
							{entries.length} question{entries.length !== 1 ? "s" : ""} to
							review
						</p>
						{entries.map((entry) => (
							<Card key={entry.id}>
								<CardHeader className="pb-2">
									<div className="flex items-center gap-2 flex-wrap">
										<Badge variant="outline">{entry.subject}</Badge>
										<Badge variant="secondary" className="text-xs">
											{entry.topic}
										</Badge>
										<ErrorTypeSelect
											value={
												errorTypes[entry.id!] ?? entry.errorType ?? "unknown"
											}
											onChange={(v) => handleErrorTypeChange(entry.id!, v)}
										/>
									</div>
									<CardTitle className="text-base font-semibold mt-2">
										<MarkdownRenderer content={entry.questionText} />
									</CardTitle>
								</CardHeader>
								<CardContent className="flex flex-col gap-3">
									<div className="grid grid-cols-2 gap-3">
										<div className="p-3 rounded-lg bg-destructive/5">
											<p className="text-xs font-medium text-destructive mb-1">
												Your answer
											</p>
											<p className="text-sm">{entry.userAnswer}</p>
										</div>
										<div className="p-3 rounded-lg bg-success/5">
											<p className="text-xs font-medium text-success mb-1">
												Correct answer
											</p>
											<p className="text-sm">{entry.correctAnswer}</p>
										</div>
									</div>
									{entry.explanation && (
										<div className="p-3 rounded-lg bg-muted/30 text-sm">
											<MarkdownRenderer content={entry.explanation} />
										</div>
									)}
									<div className="flex items-center justify-end gap-2">
										{entry.id && (
											<Button
												variant="outline"
												size="sm"
												onClick={() => handleReviewed(entry.id!)}
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
			</div>
		</div>
	);
}
