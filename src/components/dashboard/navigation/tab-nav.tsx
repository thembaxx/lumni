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
			className="flex flex-col items-center"
			onValueChange={(v) => onTabChange(v as TabValue)}
		>
			<TabsList className="bg-secondary/50 backdrop-blur-xl p-1 rounded-2xl h-11 relative">
				<span
					className={cn(
						"absolute top-1 bottom-1 bg-primary rounded-xl shadow-sm transition-all duration-300 ease-out-quart",
						activeTab === "ai"
							? "left-1 w-[calc(50%-4px)]"
							: "left-1/2 w-[calc(50%-4px)]",
					)}
				/>
				{tabs.map((tab) => (
					<TabsTrigger
						key={tab.value}
						value={tab.value}
						className={cn(
							"relative z-10 px-5 h-9 rounded-xl text-sm font-medium transition-all duration-200 data-[selected]:text-primary-foreground",
						)}
					>
						<tab.icon className="w-4 h-4 mr-1.5 transition-transform duration-200 data-[selected]:scale-110" />
						{tab.label}
					</TabsTrigger>
				))}
			</TabsList>
		</Tabs>
	);
}
