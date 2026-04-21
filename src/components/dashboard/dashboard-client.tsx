"use client";

import { useState } from "react";
import {
	DashboardHeader,
	DashboardHero,
	QuickActions,
	SearchInput,
} from "@/components/dashboard";
import type { TabValue } from "./types";

interface DashboardClientProps {
	initialTab?: TabValue;
}

export function DashboardClient({ initialTab = "ai" }: DashboardClientProps) {
	const [query, setQuery] = useState("");
	const [activeTab, setActiveTab] = useState<TabValue>(initialTab);

	return (
		<div className="min-h-screen flex flex-col bg-background">
			<DashboardHeader activeTab={activeTab} onTabChange={setActiveTab} />
			<DashboardHero />
			<div className="px-4 pb-6 space-y-3">
				<QuickActions />
				<SearchInput value={query} onChange={setQuery} />
			</div>
		</div>
	);
}
