"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { DataSet, SubQuestion } from "@/types/questions";

interface DataResponseInputProps {
	data: DataSet;
	questions: SubQuestion[];
	onSubmit: (answers: { questionId: string; answer: string }[]) => void;
	disabled?: boolean;
}

function renderDataTable(data: DataSet) {
	if (data.type !== "table" || !data.headers || !data.rows) return null;
	return (
		<div className="overflow-x-auto">
			<table className="w-full text-sm border-collapse">
				<thead>
					<tr>
						{data.headers.map((h, i) => (
							<th key={i} className="border px-3 py-2 bg-muted/30 text-left font-medium">{h}</th>
						))}
					</tr>
				</thead>
				<tbody>
					{data.rows.map((row, ri) => (
						<tr key={ri}>
							{data.headers!.map((h, ci) => (
								<td key={ci} className="border px-3 py-2">{String(row[h] ?? "")}</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

export function DataResponseInput({ data, questions, onSubmit, disabled }: DataResponseInputProps) {
	const [answers, setAnswers] = useState<Record<string, string>>({});

	const allAnswered = questions.every((q) => (answers[q.id]?.trim()?.length ?? 0) > 0);

	return (
		<div className="space-y-4">
			<div className="rounded-lg border bg-muted/20 p-4">
				<p className="text-xs font-medium text-muted-foreground mb-2">{data.title} ({data.type})</p>
				{renderDataTable(data)}
			</div>
			{questions.map((q) => (
				<div key={q.id} className="space-y-2">
					<p className="text-sm font-medium">{q.questionText} <span className="text-xs text-muted-foreground">({q.points} pts)</span></p>
					<Textarea
						value={answers[q.id] || ""}
						onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
						placeholder="Your answer..."
						disabled={disabled}
						className="min-h-[80px]"
					/>
				</div>
			))}
			<Button onClick={() => onSubmit(Object.entries(answers).map(([questionId, answer]) => ({ questionId, answer })))} disabled={disabled || !allAnswered} className="w-full">
				Submit All Answers
			</Button>
		</div>
	);
}
