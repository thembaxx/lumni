"use client";

import ArrowDown01Icon from "@hugeicons/core-free-icons/ArrowDown01Icon";
import CheckmarkCircle01Icon from "@hugeicons/core-free-icons/CheckmarkCircle01Icon";
import LinkSquare01Icon from "@hugeicons/core-free-icons/LinkSquare01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";

interface Source {
	url: string;
	title: string;
}

interface VerifiedByPillProps {
	sources: Source[];
}

function getHostname(url: string): string {
	try {
		return new URL(url).hostname.replace(/^www\./, "");
	} catch {
		return url;
	}
}

export function VerifiedByPill({ sources }: VerifiedByPillProps) {
	const [expanded, setExpanded] = useState(false);

	if (sources.length === 0) return null;

	const count = sources.length;
	const label = `Verified by ${count} web source${count === 1 ? "" : "s"}`;

	return (
		<div className="mt-5 overflow-hidden rounded-xl border border-border/50 bg-card">
			<button
				type="button"
				onClick={() => setExpanded((v) => !v)}
				aria-expanded={expanded}
				className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left transition-colors hover:bg-muted/50"
			>
				<span className="flex items-center gap-2 font-medium text-[--system-accent] text-xs">
					<HugeiconsIcon icon={CheckmarkCircle01Icon} className="size-3.5" />
					{label}
				</span>
				<HugeiconsIcon
					icon={ArrowDown01Icon}
					className={`size-3.5 text-muted-foreground transition-transform ${
						expanded ? "rotate-180" : ""
					}`}
				/>
			</button>
			{expanded && (
				<ul className="flex flex-col gap-2 border-border/50 border-t px-4 py-3 text-xs">
					{sources.map((source) => (
						<li key={source.url} className="flex items-start gap-2">
							<HugeiconsIcon
								icon={LinkSquare01Icon}
								className="mt-0.5 size-3.5 shrink-0 text-muted-foreground"
							/>
							<div className="flex min-w-0 flex-col gap-0.5">
								<span className="truncate font-medium text-foreground">
									{getHostname(source.url)}
								</span>
								<a
									href={source.url}
									target="_blank"
									rel="noopener noreferrer"
									className="break-all text-[--system-accent] underline-offset-2 hover:underline"
								>
									{source.title}
								</a>
							</div>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
