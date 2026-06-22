"use client";

import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon";
import Search01Icon from "@hugeicons/core-free-icons/Search01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, m } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ExamSearchBarProps {
	searchQuery: string;
	onSearchChange: (value: string) => void;
}

export function ExamSearchBar({
	searchQuery,
	onSearchChange,
}: ExamSearchBarProps) {
	return (
		<div className="relative">
			<HugeiconsIcon
				icon={Search01Icon}
				className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground/60"
			/>
			<Input
				type="text"
				placeholder="Search exams…"
				value={searchQuery}
				onChange={(e) => onSearchChange(e.target.value)}
				className="h-10 rounded-full border-0 bg-secondary/50 pr-10 pl-10 text-sm placeholder:text-muted-foreground/60 focus-visible:ring-1 focus-visible:ring-[--system-accent]/30"
			/>
			<AnimatePresence initial={false}>
				{searchQuery && (
					<m.div
						initial={{ opacity: 0, scale: 0.8 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.8 }}
						className="absolute top-1/2 right-3 -translate-y-1/2"
					>
						<Button
							onClick={() => onSearchChange("")}
							variant="ghost"
							size="icon"
							className="rounded-full bg-muted/60 text-muted-foreground transition-[scale] hover:bg-muted hover:text-foreground active:scale-[0.96]"
						>
							<HugeiconsIcon icon={Cancel01Icon} data-icon />
						</Button>
					</m.div>
				)}
			</AnimatePresence>
		</div>
	);
}
