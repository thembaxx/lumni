"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/shared";

interface EssayInputProps {
	value?: string | undefined;
	onChange?: (value: string) => void;
	wordLimit?: number;
	disabled?: boolean;
	rubric?: { name: string; description: string; maxScore: number }[];
	onSubmit?: (value: string) => void;
}

export function EssayInput({
	value = "",
	onChange = () => {},
	wordLimit,
	disabled,
	rubric,
	onSubmit,
}: EssayInputProps) {
	const wordCount = value
		? value.trim().split(/\s+/).filter(Boolean).length
		: 0;
	const overLimit = wordLimit !== undefined && wordCount > wordLimit;

	return (
		<div className="flex flex-col gap-4">
			{rubric && rubric.length > 0 && (
				<div className="rounded-lg bg-muted/30 p-3">
					<p className="mb-2 font-medium text-sm">Grading Criteria:</p>
					<ul className="flex flex-col gap-1">
						{rubric.map((c) => (
							<li key={c.name} className="text-muted-foreground text-sm">
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
				<div className="flex gap-3 text-muted-foreground text-xs">
					<span>Words: {wordCount}</span>
					{wordLimit !== undefined && (
						<span
							className={cn(overLimit ? "font-medium text-destructive" : "")}
						>
							Limit: {wordLimit}
						</span>
					)}
				</div>
				{onSubmit && (
					<Button
						type="button"
						onClick={() => onSubmit(value.trim())}
						disabled={disabled || overLimit || wordCount < 20 || !value.trim()}
						variant={
							!overLimit && value.trim() && wordCount >= 20
								? "default"
								: "secondary"
						}
						size="sm"
					>
						Submit Essay
					</Button>
				)}
			</div>
		</div>
	);
}
