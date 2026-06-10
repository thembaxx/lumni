"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { dexieDataAccess } from "@/lib/db";
import { storeEmbedding } from "@/lib/embedding/cache";
import { embedText } from "@/lib/embedding/client";

const RATE_LIMIT_MS = 12_000;

export default function EmbedBackfillPage() {
	const qc = useQueryClient();
	const [progress, setProgress] = useState({ done: 0, total: 0, failed: 0 });
	const [running, setRunning] = useState(false);

	const {
		data: stats,
		isLoading,
		isError,
		error,
	} = useQuery({
		queryKey: ["embed-backfill-stats"],
		queryFn: async () => {
			const [all, embeddings] = await Promise.all([
				dexieDataAccess.pastPaperQuestions.toArray(),
				dexieDataAccess.questionEmbeddings.toArray(),
			]);
			const embedded = new Set(embeddings.map((e) => e.questionId));
			const pending = all.filter((q) => !embedded.has(q.id));
			return {
				total: all.length,
				pending: pending.length,
				embedded: embedded.size,
			};
		},
	});

	const doBackfill = useCallback(async () => {
		const [all, embeddings] = await Promise.all([
			dexieDataAccess.pastPaperQuestions.toArray(),
			dexieDataAccess.questionEmbeddings.toArray(),
		]);
		const embedded = new Set(embeddings.map((e) => e.questionId));
		const pending = all.filter((q) => !embedded.has(q.id));

		setRunning(true);
		setProgress({ done: 0, total: pending.length, failed: 0 });

		let failed = 0;
		for (let i = 0; i < pending.length; i++) {
			const q = pending[i];
			try {
				const values = await embedText(q.questionText);
				if (values) {
					await storeEmbedding(
						{
							id: q.id,
							questionId: q.id,
							vector: new Float32Array(values),
							subject: q.subject,
							updatedAt: new Date().toISOString(),
						},
						dexieDataAccess.questionEmbeddings,
					);
				} else {
					failed++;
				}
			} catch {
				failed++;
			}
			setProgress({ done: i + 1, total: pending.length, failed });

			if (i < pending.length - 1) {
				await new Promise((r) => setTimeout(r, RATE_LIMIT_MS));
			}
		}

		setRunning(false);
		qc.invalidateQueries({ queryKey: ["embed-backfill-stats"] });
		toast({
			type: "success",
			message: "Backfill complete",
			description: `Embedded ${pending.length - failed}/${pending.length} questions (${failed} failed)`,
		});
	}, [qc]);

	return (
		<div className="flex flex-col gap-6 p-6">
			<h1 className="font-semibold text-2xl">Embedding Backfill</h1>
			<p className="text-muted-foreground text-sm">
				Generate embeddings for past paper questions that don't have them yet.
				Respects Gemini rate limits (~5/min).
			</p>

			<Card>
				<CardHeader>
					<CardTitle>Pool Status</CardTitle>
				</CardHeader>
				<CardContent>
					{isError ? (
						<p className="text-destructive text-sm">
							Failed to load stats: {error?.message}
						</p>
					) : isLoading ? (
						<Skeleton className="h-12 w-48" />
					) : stats ? (
						<div className="flex gap-8 text-sm">
							<div>
								<span className="text-muted-foreground">Total questions: </span>
								<span className="font-medium">{stats.total}</span>
							</div>
							<div>
								<span className="text-muted-foreground">
									Already embedded:{" "}
								</span>
								<span className="font-medium text-emerald-500">
									{stats.embedded}
								</span>
							</div>
							<div>
								<span className="text-muted-foreground">Pending: </span>
								<span className="font-medium text-amber-500">
									{stats.pending}
								</span>
							</div>
						</div>
					) : null}
				</CardContent>
			</Card>

			{running && (
				<Card>
					<CardHeader>
						<CardTitle>Progress</CardTitle>
					</CardHeader>
					<CardContent className="flex flex-col gap-3">
						<div className="h-2 w-full rounded-full bg-muted">
							<div
								className="h-full rounded-full bg-emerald-500 transition-all duration-500"
								style={{
									width: `${progress.total > 0 ? (progress.done / progress.total) * 100 : 0}%`,
								}}
							/>
						</div>
						<div className="text-muted-foreground text-sm">
							{progress.done} / {progress.total} processed
							{progress.failed > 0 && (
								<span className="text-red-500">
									{" "}
									({progress.failed} failed)
								</span>
							)}
						</div>
					</CardContent>
				</Card>
			)}

			<Button
				onClick={doBackfill}
				disabled={running || !stats || stats.pending === 0}
				className="w-fit"
			>
				{running
					? "Processing..."
					: stats && stats.pending > 0
						? `Start Backfill (${stats.pending} questions)`
						: "All Embedded"}
			</Button>
		</div>
	);
}
