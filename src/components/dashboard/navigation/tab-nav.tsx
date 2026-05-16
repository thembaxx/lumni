"use client";

import { GridFour, Snowflake, Sparkle, TrendUp } from "@phosphor-icons/react";
import { m, motion } from "framer-motion";
import { startTransition, useState } from "react";
import { Anim } from "@/components/shared/anim";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/shared";
import { iOSEase } from "@/lib/utils/animation";
import type { TabValue } from "../types";

interface TabConfig {
	value: TabValue;
	label: string;
	icon: typeof Snowflake | typeof TrendUp | typeof GridFour;
}

const tabs: TabConfig[] = [
	{ value: "ai", label: "AI", icon: Snowflake },
	{ value: "spaces", label: "Practice", icon: GridFour },
	{ value: "analytics", label: "Analytics", icon: TrendUp },
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
	const [_tabSwitch, setTabSwitch] = useState(0);

	const handleTabChange = (value: string) => {
		setTabSwitch((p) => p + 1);
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
				<motion.div
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
						className="bg-secondary/60 backdrop-blur-md border border-border/40 p-1 grid grid-cols-3 rounded-2xl h-10 relative shadow-sm"
						role="tablist"
					>
						<span
							className={cn(
								"absolute top-0.5 bottom-0.5 bg-background rounded-xl shadow-sm transition-transform duration-300 ease-ios border border-border/30",
								activeTab === "ai"
									? "left-0.5 w-[calc(33.33%-4px)]"
									: activeTab === "spaces"
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
									"relative z-10 px-4 h-8 rounded-xl text-xs font-medium transition-colors duration-200 tab-trigger-item",
									activeTab === tab.value
										? "text-foreground"
										: "text-muted-foreground hover:text-foreground",
								)}
								role="tab"
								aria-selected={activeTab === tab.value}
								tabIndex={activeTab === tab.value ? 0 : -1}
							>
								<tab.icon />
								{tab.label}
							</TabsTrigger>
						))}
					</TabsList>
				</motion.div>
			</Tabs>
		</Anim>
	);
}
