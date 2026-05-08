"use client";

import { Settings01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
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
			<div className="flex items-center gap-2">
				<Link href="/settings">
					<Button
						variant="ghost"
						size="icon"
						className="shrink-0"
						aria-label="Settings"
					>
						<HugeiconsIcon icon={Settings01Icon} className="size-5" />
					</Button>
				</Link>
				<PracticeSheet open={practiceOpen} onOpenChange={setPracticeOpen} />
			</div>
		</nav>
	);
}
