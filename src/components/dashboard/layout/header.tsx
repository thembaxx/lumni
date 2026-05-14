"use client";

import { Gear } from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/headers/page-header";
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
		<PageHeader
			title=""
			rightSection={
				<>
					<Link href="/settings">
						<Button
							variant="ghost"
							size="icon"
							className="shrink-0"
							aria-label="Settings"
						>
							<Gear className="size-5" />
						</Button>
					</Link>
					<PracticeSheet open={practiceOpen} onOpenChange={setPracticeOpen} />
				</>
			}
			bottomSection={
				<div className="flex justify-center">
					<TabNav activeTab={activeTab} onTabChange={onTabChange} />
				</div>
			}
		/>
	);
}
