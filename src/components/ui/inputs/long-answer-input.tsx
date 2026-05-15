"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/shared";

interface LongAnswerInputProps {
	value?: string | undefined;
	onChange?: (value: string) => void;
	minWords?: number;
	maxWords?: number;
	disabled?: boolean;
	onSubmit?: (value: string) => void;
}

function countWords(text: string): number {
	return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export function LongAnswerInput({
	value = "",
	onChange = () => {},
	minWords,
	maxWords,
	disabled,
	onSubmit,
}: LongAnswerInputProps) {
	const wordCount = countWords(value);
	const belowMin = minWords !== undefined && wordCount < minWords;
	const aboveMax = maxWords !== undefined && wordCount > maxWords;
	const withinRange = !belowMin && !aboveMax;

	return (
		<div className="flex flex-col gap-3">
			<Textarea
				value={value}
				onChange={(e) => onChange(e.target.value)}
				disabled={disabled}
				placeholder="Type your answer..."
				className={cn("min-h-[120px]", onSubmit && "pr-4")}
			/>
			<div className="flex items-center justify-between">
				<div className="flex gap-3 text-xs text-muted-foreground">
					<span>Words: {wordCount}</span>
					{minWords !== undefined && (
						<span className={belowMin ? "text-destructive" : ""}>
							Min: {minWords}
						</span>
					)}
					{maxWords !== undefined && (
						<span className={aboveMax ? "text-destructive" : ""}>
							Max: {maxWords}
						</span>
					)}
				</div>
				{onSubmit && (
					<Button
						type="button"
						onClick={() => onSubmit(value.trim())}
						disabled={disabled || !withinRange || !value.trim()}
						variant={withinRange && value.trim() ? "default" : "secondary"}
						size="sm"
					>
						Submit Answer
					</Button>
				)}
			</div>
		</div>
	);
}
