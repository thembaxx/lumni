"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface LongAnswerInputProps {
	minWords: number;
	maxWords: number;
	onSubmit: (answer: string) => void;
	disabled?: boolean;
}

function countWords(text: string): number {
	return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export function LongAnswerInput({ minWords, maxWords, onSubmit, disabled }: LongAnswerInputProps) {
	const [value, setValue] = useState("");
	const words = countWords(value);
	const withinRange = words >= minWords && words <= maxWords;

	return (
		<div className="space-y-3">
			<Textarea
				value={value}
				onChange={(e) => setValue(e.target.value)}
				placeholder={`Write ${minWords}-${maxWords} words...`}
				disabled={disabled}
				className="min-h-[150px] w-full"
			/>
			<div className="flex items-center justify-between">
				<span className={`text-xs ${withinRange ? "text-success" : words > maxWords ? "text-destructive" : "text-muted-foreground"}`}>
					{words} words (min: {minWords}, max: {maxWords})
				</span>
				<Button onClick={() => onSubmit(value.trim())} disabled={disabled || !withinRange}>
					Submit Answer
				</Button>
			</div>
		</div>
	);
}
