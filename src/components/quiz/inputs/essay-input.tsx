"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface EssayInputProps {
	wordLimit: number;
	rubric: { name: string; description: string; maxScore: number }[];
	onSubmit: (answer: string) => void;
	disabled?: boolean;
}

export function EssayInput({ wordLimit, rubric, onSubmit, disabled }: EssayInputProps) {
	const [value, setValue] = useState("");
	const words = value.trim() ? value.trim().split(/\s+/).length : 0;

	return (
		<div className="space-y-4">
			<div className="rounded-lg bg-muted/30 p-3">
				<p className="text-sm font-medium mb-2">Grading Criteria:</p>
				<ul className="space-y-1">
					{rubric.map((c, i) => (
						<li key={i} className="text-sm text-muted-foreground">
							<span className="font-medium">{c.name}</span> ({c.maxScore} pts): {c.description}
						</li>
					))}
				</ul>
			</div>
			<Textarea
				value={value}
				onChange={(e) => setValue(e.target.value)}
				placeholder={`Write your essay (max ${wordLimit} words)...`}
				disabled={disabled}
				className="min-h-[250px] w-full"
			/>
			<div className="flex items-center justify-between">
				<span className={`text-xs ${words <= wordLimit ? "text-muted-foreground" : "text-destructive"}`}>
					{words}/{wordLimit} words
				</span>
				<Button onClick={() => onSubmit(value.trim())} disabled={disabled || words < 20 || words > wordLimit}>
					Submit Essay
				</Button>
			</div>
		</div>
	);
}
