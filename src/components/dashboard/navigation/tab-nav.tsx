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
					className="bg-secondary/60 backdrop-blur-md border border-border/40 p-1 grid grid-cols-2 rounded-2xl h-10 relative shadow-sm"
					aria-label="Navigation tabs"
				>
					<span
						className={cn(
							"absolute top-0.5 bottom-0.5 bg-background rounded-xl shadow-sm transition-all duration-300 ease-out-quart border border-border/30",
							activeTab === "ai"
								? "left-0.5 w-[calc(33.33%-4px)]"
								: activeTab === "spaces"
									? "left-[calc(33.33%+2px)] w-[calc(33.33%-4px)]"
									: "left-[calc(66.66%+2px)] w-[calc(33.33%-4px)]",
						)}
					/>
					{tabs.map((tab) => (
						<TabsTrigger
							key={tab.value}
							value={tab.value}
							className={cn(
								"relative z-10 px-4 h-8 rounded-xl text-xs font-medium transition-all duration-200 tab-trigger-item",
								activeTab === tab.value
									? "text-foreground"
									: "text-muted-foreground hover:text-foreground",
							)}
						>
							<tab.icon
								className={cn(
									"w-3.5 h-3.5 mr-1.5 transition-transform duration-200",
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
