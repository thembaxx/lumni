"use client";

import {
	BookOpen01Icon,
	CheckmarkCircle01Icon,
	Delete01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback, useEffect, useState } from "react";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	useWrongAnswerJournal,
	type WrongAnswerEntry,
} from "@/hooks/use-wrong-answer-journal";

export default function ReviewPage() {
	const { getWrongAnswers, markReviewed, clearReviewed } =
		useWrongAnswerJournal();
	const [entries, setEntries] = useState<WrongAnswerEntry[]>([]);
	const [loading, setLoading] = useState(true);

	const load = useCallback(async () => {
		setLoading(true);
		const data = await getWrongAnswers();
		setEntries(data);
		setLoading(false);
	}, [getWrongAnswers]);

	useEffect(() => {
		load();
	}, [load]);

	const handleReviewed = async (id: number) => {
		await markReviewed(id);
		setEntries((prev) => prev.filter((e) => e.id !== id));
	};

	const handleClearReviewed = async () => {
		await clearReviewed();
		load();
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
					<h1 className="ios-title-1 font-extrabold text-foreground tracking-tight">
						Wrong Answer Journal
					</h1>
					{entries.length > 0 && (
						<Button variant="ghost" size="sm" onClick={handleClearReviewed}>
							<HugeiconsIcon icon={Delete01Icon} data-icon="inline-start" />
							Clear reviewed
						</Button>
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
								Wrong answers will appear here automatically after quizzes and
								exams.
							</p>
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
									<div className="flex items-center gap-2">
										<Badge variant="outline">{entry.subject}</Badge>
										<Badge variant="secondary" className="text-xs">
											{entry.topic}
										</Badge>
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
									{entry.id && (
										<Button
											variant="outline"
											size="sm"
											onClick={() => handleReviewed(entry.id!)}
											className="self-end"
										>
											<HugeiconsIcon
												icon={CheckmarkCircle01Icon}
												data-icon="inline-start"
											/>
											Mark reviewed
										</Button>
									)}
								</CardContent>
							</Card>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
