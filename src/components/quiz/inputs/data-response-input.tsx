"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
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
			<Table>
				<TableHeader>
					<TableRow>
						{data.headers.map((h, i) => (
							<TableHead key={i}>{h}</TableHead>
						))}
					</TableRow>
				</TableHeader>
				<TableBody>
					{data.rows.map((row, ri) => (
						<TableRow key={ri}>
							{data.headers!.map((h, ci) => (
								<TableCell key={ci}>{String(row[h] ?? "")}</TableCell>
							))}
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}

export function DataResponseInput({
	data,
	questions,
	onSubmit,
	disabled,
}: DataResponseInputProps) {
	const [answers, setAnswers] = useState<Record<string, string>>({});

	const allAnswered = questions.every(
		(q) => (answers[q.id]?.trim()?.length ?? 0) > 0,
	);

	return (
		<div className="space-y-4">
			<div className="rounded-lg border bg-muted/20 p-4">
				<p className="text-xs font-medium text-muted-foreground mb-2">
					{data.title} ({data.type})
				</p>
				{renderDataTable(data)}
			</div>
			{questions.map((q) => (
				<div key={q.id} className="space-y-2">
					<p className="text-sm font-medium">
						{q.questionText}{" "}
						<span className="text-xs text-muted-foreground">
							({q.points} pts)
						</span>
					</p>
					<Textarea
						value={answers[q.id] || ""}
						onChange={(e) =>
							setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
						}
						placeholder="Your answer..."
						disabled={disabled}
						className="min-h-[80px]"
					/>
				</div>
			))}
			<Button
				onClick={() =>
					onSubmit(
						Object.entries(answers).map(([questionId, answer]) => ({
							questionId,
							answer,
						})),
					)
				}
				disabled={disabled || !allAnswered}
				className="w-full"
			>
				Submit All Answers
			</Button>
		</div>
	);
}
