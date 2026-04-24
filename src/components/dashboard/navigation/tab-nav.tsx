"use client";

import { LayoutGrid, Shield, Snowflake } from "lucide-react";
import { startTransition, ViewTransition } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { TabValue } from "../types";

interface TabConfig {
	value: TabValue;
	label: string;
	icon: typeof Snowflake;
}

const tabs: TabConfig[] = [
	{ value: "ai", label: "AI", icon: Snowflake },
	{ value: "spaces", label: "Spaces", icon: LayoutGrid },
	{ value: "admin", label: "Admin", icon: Shield },
];

interface TabNavProps {
	activeTab: TabValue;
	onTabChange: (tab: TabValue) => void;
}

export function TabNav({ activeTab, onTabChange }: TabNavProps) {
	const handleTabChange = (value: string) => {
		startTransition(() => {
			onTabChange(value as TabValue);
		});
	};

	return (
		<Tabs
			value={activeTab}
			className="flex flex-col items-center"
			onValueChange={handleTabChange}
		>
			<ViewTransition default="none" enter="vt-fade-in" exit="vt-fade-out">
				<TabsList
					className="bg-secondary/50 backdrop-blur-xl p-1 grid grid-cols-2 rounded-3xl h-11 relative"
					aria-label="Navigation tabs"
				>
					<span
						className={cn(
							"absolute top-1 bottom-1 bg-primary/10 rounded-[20px] shadow-sm transition-all duration-300 ease-out-quart",
							activeTab === "ai"
								? "left-1 w-[calc(33.33%-4px)]"
								: activeTab === "spaces"
									? "left-[calc(33.33%+4px)] w-[calc(33.33%-4px)]"
									: "left-[calc(66.66%+4px)] w-[calc(33.33%-4px)]",
						)}
					/>
					{tabs.map((tab) => (
						<TabsTrigger
							key={tab.value}
							value={tab.value}
							className={cn(
								"relative z-10 px-5 h-9 rounded-[20px] text-sm font-medium transition-all duration-200 data-selected:text-primary-foreground tab-trigger-item",
							)}
						>
							<tab.icon
								className={cn(
									"w-4 h-4 mr-1.5 transition-transform duration-200",
									activeTab === tab.value && "tab-icon-active",
								)}
							/>
							{tab.label}
						</TabsTrigger>
					))}
				</TabsList>
			</ViewTransition>
		</Tabs>
	);
}
