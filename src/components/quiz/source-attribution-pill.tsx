"use client";

import { CheckmarkCircle01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/lib/shared";

export interface SourceAttributionPillSource {
	url: string;
	title: string;
}

export interface SourceAttributionPillProps {
	sources: SourceAttributionPillSource[];
	className?: string;
}

/**
 * Small, inline, non-collapsible pill that surfaces the web sources a
 * single question was grounded in. Used on the per-question feedback
 * card. Visually lighter than the large collapsible `VerifiedByPill`
 * on the quiz results page (which surfaces batch-level sources).
 *
 * Renders nothing when `sources` is empty. Truncates the source list
 * to 2 items with a "+N more" suffix to avoid visual clutter.
 */
export function SourceAttributionPill({
	sources,
	className,
}: SourceAttributionPillProps) {
	if (!sources || sources.length === 0) return null;

	const MAX_VISIBLE = 2;
	const visible = sources.slice(0, MAX_VISIBLE);
	const overflow = sources.length - visible.length;

	return (
		<div
			role="note"
			className={cn(
				"flex flex-wrap items-center gap-x-1.5 gap-y-1 text-foreground/70 text-xs",
				className,
			)}
			aria-label={`${sources.length} web ${sources.length === 1 ? "source" : "sources"}`}
		>
			<HugeiconsIcon
				icon={CheckmarkCircle01Icon}
				className="size-3.5 shrink-0"
				aria-hidden="true"
			/>
			<span className="font-medium">Grounded in:</span>
			{visible.map((src, idx) => (
				<span key={src.url} className="inline-flex items-center">
					{idx > 0 && (
						<span className="mx-1 text-foreground/40" aria-hidden="true">
							·
						</span>
					)}
					<a
						href={src.url}
						target="_blank"
						rel="noopener noreferrer"
						className="underline-offset-2 hover:text-foreground hover:underline"
					>
						{src.title}
					</a>
				</span>
			))}
			{overflow > 0 && (
				<span className="text-foreground/50">+{overflow} more</span>
			)}
		</div>
	);
}
