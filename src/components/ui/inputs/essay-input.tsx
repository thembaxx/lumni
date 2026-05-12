"use client";

import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface EssayInputProps {
	value: string | undefined;
	onChange: (value: string) => void;
	wordLimit?: number;
	disabled?: boolean;
	rubric?: { name: string; description: string; maxScore: number }[];
	onSubmit?: (value: string) => void;
}

export function EssayInput({
	value = "",
	onChange,
	wordLimit,
	disabled,
	rubric,
	onSubmit,
}: EssayInputProps) {
	const wordCount = value ? value.trim().split(/\s+/).filter(Boolean).length : 0;
	const overLimit = wordLimit !== undefined && wordCount > wordLimit;

	return (
		<div className="space-y-4">
			{rubric && rubric.length > 0 && (
				<div className="rounded-lg bg-muted/30 p-3">
					<p className="text-sm font-medium mb-2">Grading Criteria:</p>
					<ul className="space-y-1">
						{rubric.map((c, i) => (
							<li key={i} className="text-sm text-muted-foreground">
								<span className="font-medium">{c.name}</span> ({c.maxScore}{" "}
								pts): {c.description}
							</li>
						))}
					</ul>
				</div>
			)}
			<Textarea
				value={value}
				onChange={(e) => onChange(e.target.value)}
				disabled={disabled}
				placeholder={
					wordLimit
						? `Write your essay (max ${wordLimit} words)...`
						: "Write your essay here..."
				}
				className={cn("min-h-[250px]", onSubmit && "pr-4")}
			/>
			<div className="flex items-center justify-between">
				<div className="flex gap-3 text-xs text-muted-foreground">
					<span>Words: {wordCount}</span>
					{wordLimit !== undefined && (
						<span
							className={cn(
								overLimit ? "text-destructive font-medium" : "",
							)}
						>
							Limit: {wordLimit}
						</span>
					)}
				</div>
				{onSubmit && (
					<button
						type="button"
						onClick={() => onSubmit(value.trim())}
						disabled={disabled || overLimit || wordCount < 20 || !value.trim()}
						className={cn(
							"rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
							!overLimit && value.trim() && wordCount >= 20
								? "bg-primary text-primary-foreground hover:bg-primary/90"
								: "bg-muted text-muted-foreground cursor-not-allowed",
						)}
					>
						Submit Essay
					</button>
				)}
			</div>
		</div>
	);
}