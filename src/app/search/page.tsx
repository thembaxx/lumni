"use client";

import { Book01Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SubjectsDrawer } from "@/components/dashboard/drawers/subjects-drawer";
import { SearchResults } from "@/components/dashboard/search/search-results";
import { Input } from "@/components/ui/input";

export default function SearchPage() {
	const [query, setQuery] = useState("");
	const router = useRouter();

	return (
		<div className="flex flex-col h-full bg-background">
			<div className="p-4 border-b border-border/30 shrink-0">
				<div className="flex items-center gap-2">
					<HugeiconsIcon
						icon={Search01Icon}
						size={16}
						className="text-muted-foreground shrink-0"
					/>
					<Input
						type="text"
						placeholder="Ask anything about your studies…"
						aria-label="Search your study materials"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						autoFocus
						className="bg-transparent text-foreground placeholder:text-muted-foreground/60 shadow-none border-0 p-0 focus-visible:ring-0 text-base"
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
			</div>
			<div className="flex-1 overflow-y-auto p-4">
				<SearchResults
					query={query}
					onClose={() => router.push("/dashboard")}
				/>
			</div>
		</div>
	);
}
