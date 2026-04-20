"use client";

import { LayoutGrid, Snowflake } from "lucide-react";
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
];

interface TabNavProps {
	activeTab: TabValue;
	onTabChange: (tab: TabValue) => void;
}

export function TabNav({ activeTab, onTabChange }: TabNavProps) {
	return (
		<Tabs
			value={activeTab}
			className="flex flex-col items-center space-y-4"
			onValueChange={(v) => onTabChange(v as TabValue)}
		>
			<TabsList className="bg-secondary/40 backdrop-blur-2xl p-1 rounded-2xl">
				{tabs.map((tab) => (
					<TabsTrigger
						key={tab.value}
						value={tab.value}
						className={cn(
							"px-6 h-10",
							activeTab === tab.value &&
								"bg-zinc-500 border border-border text-primary-foreground",
						)}
					>
						<tab.icon className="w-5 h-5" />
					</TabsTrigger>
				))}
			</TabsList>
		</Tabs>
	);
}
