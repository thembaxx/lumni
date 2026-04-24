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
			<div className="grow">
				<StudyTopicCardExample />
			</div>
			<div className="px-4 pb-6 space-y-3">
				<QuickActions />
				<SearchInput value={query} onChange={setQuery} />
			</div>
		</div>
	);
}
