"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { QuickActions, SearchInput } from "@/components/dashboard";
import { XpLevelCard } from "@/components/gamification";
import { useGamification } from "@/lib/hooks/use-gamification";
import StudyTopicCardExample from "../study/example";
import type { TabValue } from "./types";

interface DashboardClientProps {
	initialTab?: TabValue;
}

const containerVariants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: {
			staggerChildren: 0.08,
			delayChildren: 0.1,
		},
	},
};

const itemVariants = {
	hidden: { opacity: 0, y: 16 },
	visible: {
		opacity: 1,
		y: 0,
		transition: {
			type: "spring" as const,
			stiffness: 300,
			damping: 30,
		},
	},
};

export function DashboardClient({ initialTab = "ai" }: DashboardClientProps) {
	const [query, setQuery] = useState("");
	const [_activeTab] = useState<TabValue>(initialTab || "ai");
	const [_practiceOpen, setPracticeOpen] = useState(false);
	const { levelInfo, isLoaded, gamification } = useGamification();

	if (!isLoaded) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="animate-pulse text-muted-foreground">Loading...</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen flex flex-col bg-background pb-20">
			<motion.div
				className="max-w-md mx-auto"
				variants={containerVariants}
				initial="hidden"
				animate="visible"
			>
				<motion.div
					variants={itemVariants}
					className="mb-4 bg-card rounded-2xl p-4"
				>
					<XpLevelCard levelInfo={levelInfo} totalXp={gamification.totalXp} />
				</motion.div>

				<motion.div variants={itemVariants} className="mb-6">
					<StudyTopicCardExample />
				</motion.div>

				<div className="space-y-4">
					<motion.div variants={itemVariants}>
						<QuickActions onPracticeClick={() => setPracticeOpen(true)} />
					</motion.div>
					<motion.div variants={itemVariants}>
						<SearchInput value={query} onChange={setQuery} />
					</motion.div>
				</div>
			</motion.div>
		</div>
	);
}
