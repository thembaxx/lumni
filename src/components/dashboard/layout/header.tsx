"use client";

import { useState } from "react";
import { TabNav } from "../navigation/tab-nav";
import { PracticeSheet } from "../practice/practice-sheet";
import type { TabValue } from "../types";

export type { TabValue };

interface DashboardHeaderProps {
	activeTab: TabValue;
	onTabChange: (tab: TabValue) => void;
}

export function DashboardHeader({
	activeTab,
	onTabChange,
}: DashboardHeaderProps) {
	const [practiceOpen, setPracticeOpen] = useState(false);

	return (
		<nav className="flex items-center justify-between px-4 py-4 w-full animate-fade-in-up border-b border-border/30">
			<div className="w-10" />
			<TabNav activeTab={activeTab} onTabChange={onTabChange} />
			<PracticeSheet open={practiceOpen} onOpenChange={setPracticeOpen} />
		</nav>
	);
}
