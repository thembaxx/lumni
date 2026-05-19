"use client";

import { Book01Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/shared";
import { SubjectsDrawer } from "../drawers/subjects-drawer";
import { SearchResults } from "./search-results";

export function SearchWidget() {
	const [query, setQuery] = useState("");
	const [isFocused, setIsFocused] = useState(false);

	return (
		<div
			className={cn(
				"rounded-2xl border border-border/30 bg-secondary/60 p-4 transition-all duration-300",
				isFocused &&
					"border-[--system-accent]/30 ring-2 ring-[--system-accent]/20",
			)}
		>
			<div className="flex items-center gap-2">
				<HugeiconsIcon
					icon={Search01Icon}
					size={16}
					className="shrink-0 text-muted-foreground"
				/>
				<Input
					type="text"
					placeholder="Ask anything about your studies..."
					aria-label="Ask anything about your studies"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					onFocus={() => setIsFocused(true)}
					onBlur={() => setIsFocused(false)}
					className="border-0 bg-transparent p-0 text-foreground shadow-none placeholder:text-muted-foreground/60 focus-visible:ring-0"
				/>
				<SubjectsDrawer>
					<button
						type="button"
						className="rounded-lg bg-muted/60 p-1.5 transition-colors hover:bg-muted"
						aria-label="Browse subjects"
					>
						<HugeiconsIcon
							icon={Book01Icon}
							size={16}
							className="text-muted-foreground"
						/>
					</button>
				</SubjectsDrawer>
			</div>
			<SearchResults query={query} />
		</div>
	);
}
