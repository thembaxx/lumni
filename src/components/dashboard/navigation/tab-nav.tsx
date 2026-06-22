"use client";

import Calendar01Icon from "@hugeicons/core-free-icons/Calendar01Icon";
import ChartUpIcon from "@hugeicons/core-free-icons/ChartUpIcon";
import GridIcon from "@hugeicons/core-free-icons/GridIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import * as m from "motion/react-m";
import { startTransition, useRef } from "react";
import { Anim } from "@/components/shared/anim";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { iOSEase } from "@/lib/utils/animation";
import type { TabValue } from "../types";

interface TabConfig {
	value: TabValue;
	label: string;
	icon: typeof Calendar01Icon;
}

const tabs: TabConfig[] = [
	{ value: "today", label: "Today", icon: Calendar01Icon },
	{ value: "practice", label: "Practice", icon: GridIcon },
	{ value: "analytics", label: "Analytics", icon: ChartUpIcon },
];

interface TabNavProps {
	activeTab: TabValue;
	onTabChange: (tab: TabValue) => void;
	"aria-label"?: string;
}

export function TabNav({
	activeTab,
	onTabChange,
	"aria-label": ariaLabel = "Main navigation",
}: TabNavProps) {
	const tabSwitchRef = useRef(0);

	const handleTabChange = (value: string) => {
		tabSwitchRef.current += 1;
		startTransition(() => {
			onTabChange(value as TabValue);
		});
	};

	return (
		<Anim>
			<Tabs
				value={activeTab}
				className="flex flex-col items-center pt-6"
				onValueChange={handleTabChange}
				aria-label={ariaLabel}
			>
				<m.div
					initial={{ opacity: 0, y: -8 }}
					animate={{
						opacity: 1,
						y: 0,
						transition: {
							duration: 0.3,
							ease: iOSEase,
						},
					}}
				>
					<TabsList
						className="relative grid h-12 grid-cols-3 rounded-2xl border border-border/40 bg-system-background p-1 shadow-sm"
						role="tablist"
					>
						<span
							className={cn(
								"absolute top-0.5 bottom-0.5 rounded-xl border border-border/30 bg-background shadow-sm transition-[left,width] duration-300 ease-ios",
								activeTab === "today"
									? "left-0.5 w-[calc(33.33%-4px)]"
									: activeTab === "practice"
										? "left-[calc(33.33%+2px)] w-[calc(33.33%-4px)]"
										: activeTab === "analytics"
											? "left-[calc(66.66%+2px)] w-[calc(33.33%-4px)]"
											: "left-[calc(66.66%+2px)] w-[calc(33.33%-4px)]",
							)}
						/>
						{tabs.map((tab) => (
							<TabsTrigger
								key={tab.value}
								value={tab.value}
								className={cn(
									"tab-trigger-item relative z-elevated h-10 rounded-xl px-4 font-medium text-xs transition-[color,transform] duration-200 active:scale-[0.96]",
									activeTab === tab.value
										? "text-foreground"
										: "text-muted-foreground hover:text-foreground",
								)}
								role="tab"
								aria-selected={activeTab === tab.value}
								tabIndex={activeTab === tab.value ? 0 : -1}
							>
								<HugeiconsIcon icon={tab.icon} />
								{tab.label}
							</TabsTrigger>
						))}
					</TabsList>
				</m.div>
			</Tabs>
		</Anim>
	);
}
