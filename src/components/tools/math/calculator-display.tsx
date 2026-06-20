"use client";

import { Copy01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/lib/utils";

interface CalculatorDisplayProps {
	expression: string;
	result: string;
	error: boolean;
	onCopy: () => void;
}

export function CalculatorDisplay({
	expression,
	result,
	error,
	onCopy,
}: CalculatorDisplayProps) {
	return (
		<div className="mb-4 flex min-h-[88px] flex-col justify-end rounded-xl border border-border/50 bg-system-surface p-4">
			<div className="mb-1 select-all truncate text-right font-mono text-muted-foreground/60 text-xs">
				{expression || "0"}
			</div>
			<div className="flex items-center justify-between gap-2">
				<button
					type="button"
					onClick={onCopy}
					className="shrink-0 text-muted-foreground/40 transition-colors hover:text-muted-foreground"
					aria-label="Copy result"
				>
					<HugeiconsIcon icon={Copy01Icon} className="size-3.5" data-icon />
				</button>
				<span
					className={cn(
						"select-all font-mono font-semibold text-2xl tracking-tight",
						error ? "text-destructive" : "text-[--system-text-primary]",
					)}
				>
					{result}
				</span>
			</div>
		</div>
	);
}
