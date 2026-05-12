"use client";

import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface LongAnswerInputProps {
	value: string | undefined;
	onChange: (value: string) => void;
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
	onChange,
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
		<div className="space-y-3">
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
					<button
						type="button"
						onClick={() => onSubmit(value.trim())}
						disabled={disabled || !withinRange || !value.trim()}
						className={cn(
							"rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
							withinRange && value.trim()
								? "bg-primary text-primary-foreground hover:bg-primary/90"
								: "bg-muted text-muted-foreground cursor-not-allowed",
						)}
					>
						Submit Answer
					</button>
				)}
			</div>
		</div>
	);
}