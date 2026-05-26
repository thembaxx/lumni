"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { UserAnswer } from "@/lib/question-engine/types";

interface DataResponseInputProps {
	body: Record<string, unknown>;
	onGrade: (answer: UserAnswer) => Promise<void>;
}

export function DataResponseInput({ body, onGrade }: DataResponseInputProps) {
	const t = useTranslations();
	const questions = body.questions as Record<string, unknown>[] | undefined;
	const [partAnswers, setPartAnswers] = useState<Record<string, string>>({});

	return (
		<div className="flex flex-col gap-3">
			<div className="whitespace-pre-wrap rounded-lg bg-muted/30 p-4 font-mono text-sm">
				{typeof body.data === "string"
					? body.data
					: JSON.stringify(body.data, null, 2)}
			</div>
			{questions?.map((q, i: number) => {
				const qId = String((q as Record<string, unknown>).id ?? i);
				return (
					<div key={qId} className="flex flex-col gap-2 rounded-lg border p-3">
						<p className="mb-1 font-medium text-sm">
							{String((q as Record<string, unknown>).questionText ?? "")}
						</p>
						<input
							type="text"
							className="w-full rounded-md border bg-transparent px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[--system-accent]"
							placeholder={t("quiz.answerPlaceholder")}
							value={partAnswers[qId] ?? ""}
							onChange={(e) =>
								setPartAnswers((prev) => ({
									...prev,
									[qId]: e.target.value,
								}))
							}
							aria-label={`Answer for question ${i + 1}`}
						/>
					</div>
				);
			})}
			<Button
				onClick={() => {
					onGrade({
						type: "mixed",
						value:
							questions?.map((q: Record<string, unknown>, i: number) => {
								const qId = String(q.id ?? i);
								return {
									partId: qId,
									answer: { type: "text", value: partAnswers[qId] ?? "" },
								};
							}) ?? [],
					});
				}}
				disabled={
					!questions ||
					questions.length === 0 ||
					Object.values(partAnswers).every((v) => !v.trim())
				}
			>
				{t("quiz.submitAnswer")}
			</Button>
		</div>
	);
}
