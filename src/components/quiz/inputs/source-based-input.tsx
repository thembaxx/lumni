"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import type { Source, SubQuestion } from "@/types/questions";

interface SourceBasedInputProps {
	source: Source;
	subQuestions: SubQuestion[];
	onSubmit: (answers: { subQuestionId: string; answer: string }[]) => void;
	disabled?: boolean;
}

export function SourceBasedInput({ source, subQuestions, onSubmit, disabled }: SourceBasedInputProps) {
	const [answers, setAnswers] = useState<Record<string, string>>({});

	const allAnswered = subQuestions.every((sq) => (answers[sq.id]?.trim()?.length ?? 0) > 0);

	return (
		<div className="space-y-4">
			<div className="rounded-lg border bg-muted/20 p-4">
				<p className="text-xs font-medium text-muted-foreground mb-2">Source: {source.type}</p>
				<MarkdownRenderer content={source.content} />
				{source.attribution && (
					<p className="text-xs text-muted-foreground mt-2">— {source.attribution}</p>
				)}
			</div>
			{subQuestions.map((sq) => (
				<div key={sq.id} className="space-y-2">
					<p className="text-sm font-medium">{sq.questionText} <span className="text-xs text-muted-foreground">({sq.points} pts)</span></p>
					<Textarea
						value={answers[sq.id] || ""}
						onChange={(e) => setAnswers((prev) => ({ ...prev, [sq.id]: e.target.value }))}
						placeholder="Your answer..."
						disabled={disabled}
						className="min-h-[80px]"
					/>
				</div>
			))}
			<Button onClick={() => onSubmit(Object.entries(answers).map(([subQuestionId, answer]) => ({ subQuestionId, answer })))} disabled={disabled || !allAnswered} className="w-full">
				Submit All Answers
			</Button>
		</div>
	);
}
