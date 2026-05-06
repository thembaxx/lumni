"use client";

import { useState } from "react";
import {
	DashboardHeader,
	QuickActions,
	SearchInput,
} from "@/components/dashboard";
import StudyTopicCardExample from "../study/example";
import type { TabValue } from "./types";

interface DashboardClientProps {
	initialTab?: TabValue;
}

export function DashboardClient({ initialTab = "ai" }: DashboardClientProps) {
	const [query, setQuery] = useState("");
	const activeTab = initialTab || "ai";

	return (
		<div className="min-h-screen flex flex-col bg-background">
			<DashboardHeader
				activeTab={activeTab as TabValue}
				onTabChange={() => {}}
			/>
			<div className="grow px-4 pt-2">
				<div className="mb-6 animate-fade-in-up">
					<h2 className="text-xl font-semibold tracking-tight">Welcome back</h2>
					<p className="text-muted-foreground text-sm mt-1">
						Ready to ace your exams?
					</p>
				</div>
				<StudyTopicCardExample />
			</div>
			<div className="px-4 pb-6 space-y-4">
				<QuickActions />
				<SearchInput value={query} onChange={setQuery} />
			</div>
		</div>
	);
}
