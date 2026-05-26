"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { UserAnswer } from "@/lib/question-engine/types";

interface MixedPartsInputProps {
	parts: Record<string, unknown>[] | undefined;
	onGrade: (answer: UserAnswer) => Promise<void>;
}

export function MixedPartsInput({ parts, onGrade }: MixedPartsInputProps) {
	const t = useTranslations();
	const [partAnswers, setPartAnswers] = useState<Record<string, string>>({});

	return (
		<div className="flex flex-col gap-4">
			{parts?.map((part, i: number) => {
				const p = part as Record<string, unknown>;
				const pId = String(p.id ?? i);
				return (
					<div key={pId} className="flex flex-col gap-2 rounded-lg border p-3">
						<p className="mb-1 font-medium text-sm">
							{i + 1}. {String(p.questionText ?? "")}{" "}
							<span className="text-muted-foreground text-xs">
								{t("quiz.pointsParenthetical", {
									points: String(p.points ?? ""),
								})}
							</span>
						</p>
						<input
							type="text"
							className="w-full rounded-md border bg-transparent px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[--system-accent]"
							placeholder={t("quiz.answerPlaceholder")}
							value={partAnswers[pId] ?? ""}
							onChange={(e) =>
								setPartAnswers((prev) => ({
									...prev,
									[pId]: e.target.value,
								}))
							}
							aria-label={`Answer for question ${i + 1}`}
						/>
					</div>
				);
			})}
			<Button
				onClick={() =>
					onGrade({
						type: "mixed",
						value:
							parts?.map((p, i: number) => {
								const part = p as Record<string, unknown>;
								const pId = String(part.id ?? i);
								return {
									partId: pId,
									answer: { type: "text", value: partAnswers[pId] ?? "" },
								};
							}) ?? [],
					})
				}
				disabled={
					!parts ||
					parts.length === 0 ||
					Object.values(partAnswers).every((v) => !v.trim())
				}
				className="w-full"
			>
				{t("quiz.submitAllParts")}
			</Button>
		</div>
	);
}
