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
				"bg-secondary/60 rounded-2xl p-4 transition-all duration-300 border border-border/30",
				isFocused && "ring-2 ring-[--system-accent]/20 border-[--system-accent]/30",
			)}
		>
			<div className="flex items-center gap-2">
				<HugeiconsIcon
					icon={Search01Icon}
					size={16}
					className="text-muted-foreground shrink-0"
				/>
				<Input
					type="text"
					placeholder="Ask anything about your studies..."
					aria-label="Ask anything about your studies"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					onFocus={() => setIsFocused(true)}
					onBlur={() => setIsFocused(false)}
					className="bg-transparent text-foreground placeholder:text-muted-foreground/60 text-sm shadow-none border-0 p-0 focus-visible:ring-0"
				/>
				<SubjectsDrawer>
					<button
						type="button"
						className="bg-muted/60 hover:bg-muted rounded-lg p-1.5 transition-colors"
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
