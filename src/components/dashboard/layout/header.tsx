"use client";

import { Settings01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/headers/page-header";
import { TabNav } from "../navigation/tab-nav";
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
	return (
		<PageHeader
			title=""
			rightSection={
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
			}
			bottomSection={
				<div className="flex justify-center">
					<TabNav activeTab={activeTab} onTabChange={onTabChange} />
				</div>
			}
		/>
	);
}
