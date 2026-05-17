"use client";

import {
	AlertCircleIcon,
	BookOpen01Icon,
	File01Icon,
	NoteIcon,
	StarSquareIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import type { SearchResultItem } from "@/lib/services/search-service";
import { searchAll } from "@/lib/services/search-service";
import { cn } from "@/lib/shared";

const typeConfig: Record<
	SearchResultItem["type"],
	{ label: string; icon: typeof File01Icon; color: string }
> = {
	question: { label: "Question", icon: File01Icon, color: "text-blue-500" },
	flashcard: {
		label: "Flashcard",
		icon: StarSquareIcon,
		color: "text-amber-500",
	},
	"wrong-answer": {
		label: "Mistake",
		icon: AlertCircleIcon,
		color: "text-destructive",
	},
	note: { label: "Note", icon: NoteIcon, color: "text-green-500" },
	"study-set": {
		label: "Study Set",
		icon: BookOpen01Icon,
		color: "text-purple-500",
	},
	exam: { label: "Exam", icon: BookOpen01Icon, color: "text-orange-500" },
};

interface SearchResultsProps {
	query: string;
	onClose?: () => void;
	className?: string;
}

export function SearchResults({
	query,
	onClose,
	className,
}: SearchResultsProps) {
	const [results, setResults] = useState<SearchResultItem[]>([]);
	const [loading, setLoading] = useState(false);
	const [selectedIndex, setSelectedIndex] = useState(0);
	const listRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!query || query.length < 2) {
			setResults([]);
			return;
		}

		setLoading(true);
		const timer = setTimeout(async () => {
			const items = await searchAll(query);
			setResults(items);
			setSelectedIndex(0);
			setLoading(false);
		}, 200);

		return () => clearTimeout(timer);
	}, [query]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (results.length === 0) return;
			if (e.key === "ArrowDown") {
				e.preventDefault();
				setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
			} else if (e.key === "ArrowUp") {
				e.preventDefault();
				setSelectedIndex((i) => Math.max(i - 1, 0));
			}
		},
		[results.length],
	);

	useEffect(() => {
		const el = listRef.current?.children[selectedIndex] as
			| HTMLElement
			| undefined;
		el?.scrollIntoView({ block: "nearest" });
	}, [selectedIndex]);

	if (!query || query.length < 2) return null;

	return (
		<div className={cn("mt-2 space-y-1", className)} onKeyDown={handleKeyDown}>
			{loading && (
				<p className="text-xs text-muted-foreground px-1">Searching...</p>
			)}
			{!loading && results.length === 0 && (
				<p className="text-xs text-muted-foreground px-1">
					No results for "{query}"
				</p>
			)}
			<div ref={listRef} className="max-h-80 overflow-y-auto space-y-0.5">
				{results.map((item, i) => {
					const config = typeConfig[item.type];
					return (
						<button
							type="button"
							key={item.id}
							onClick={onClose}
							className={cn(
								"w-full text-left flex items-start gap-3 p-2.5 rounded-xl transition-colors",
								i === selectedIndex ? "bg-accent" : "hover:bg-accent/50",
							)}
						>
							<div className="mt-0.5 shrink-0">
								<HugeiconsIcon
									icon={config.icon}
									size={16}
									className={cn(config.color)}
								/>
							</div>
							<div className="min-w-0 flex-1">
								<p className="text-sm font-medium truncate">{item.title}</p>
								<p className="text-xs text-muted-foreground truncate mt-0.5">
									{item.snippet}
								</p>
							</div>
							<div className="shrink-0 flex items-center gap-1.5">
								<Badge variant="secondary" className="text-[10px] px-1.5 py-0">
									{config.label}
								</Badge>
								{item.subject && (
									<span className="text-[10px] text-muted-foreground font-mono truncate max-w-[60px]">
										{item.subject}
									</span>
								)}
							</div>
						</button>
					);
				})}
			</div>
		</div>
	);
}
