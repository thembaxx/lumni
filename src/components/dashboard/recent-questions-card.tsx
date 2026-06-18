"use client";

import { m } from "framer-motion";
import { useEffect, useState } from "react";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { WrongAnswerEntry } from "@/hooks/use-wrong-answer-journal";
import { useWrongAnswerJournal } from "@/hooks/use-wrong-answer-journal";
import { useRouter } from "@/i18n/navigation";
import { logError } from "@/lib/shared/logger";

export function RecentQuestionsCard() {
	const { getWrongAnswers } = useWrongAnswerJournal();
	const { push } = useRouter();
	const [entries, setEntries] = useState<WrongAnswerEntry[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		getWrongAnswers(undefined, undefined, 5)
			.then((data) => {
				setEntries(data);
				setLoading(false);
			})
			.catch((err) => {
				logError("RecentQuestionsCard", err);
				setLoading(false);
			});
	}, [getWrongAnswers]);

	if (entries.length === 0 && !loading) return null;

	if (loading) {
		return (
			<Card className="overflow-hidden rounded-3xl shadow-level-1">
				<CardHeader>
					<CardTitle className="font-extrabold text-lg">
						Recent Questions
					</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-col gap-3 p-5 pt-0">
					{Array.from({ length: 3 }).map((_, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: static skeleton loader
						<div key={i} className="rounded-2xl border bg-card p-4">
							<div className="mb-2 flex items-center gap-2">
								<Skeleton className="h-4 w-16 rounded-full" />
								<Skeleton className="h-3 w-20" />
							</div>
							<Skeleton className="h-4 w-full" />
							<Skeleton className="mt-1 h-4 w-3/4" />
						</div>
					))}
				</CardContent>
			</Card>
		);
	}

	return (
		<m.div
			initial={{ opacity: 0, y: 16 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
		>
			<Card className="overflow-hidden rounded-2xl shadow-level-1">
				<CardHeader>
					<CardTitle className="font-extrabold text-lg">
						Recent Questions
					</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-col gap-3 p-5 pt-0">
					{entries.map((entry) => (
						<div
							key={entry.id}
							className="rounded-2xl border bg-card p-4 text-sm"
						>
							<div className="mb-1 flex items-center gap-2">
								<span className="rounded-full bg-[--system-accent]/10 px-2 py-0.5 font-medium text-[10px] text-muted-foreground uppercase tracking-wide">
									{entry.subject}
								</span>
								{entry.topic && (
									<span className="text-[10px] text-muted-foreground">
										{entry.topic}
									</span>
								)}
							</div>
							<div className="line-clamp-2 leading-relaxed">
								<MarkdownRenderer content={entry.questionText} />
							</div>
						</div>
					))}
					<Button
						variant="outline"
						size="sm"
						onClick={() => push("/review")}
						className="self-start text-xs"
					>
						Review all
					</Button>
				</CardContent>
			</Card>
		</m.div>
	);
}
