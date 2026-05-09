"use client";

import { motion } from "framer-motion";
import { BookOpen, FileText, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminTabsProps {
	activeTab: "exam" | "subjects";
	onTabChange: (tab: "exam" | "subjects") => void;
}

const springTransition = {
	type: "spring" as const,
	stiffness: 300,
	damping: 25,
};

function AnimatedTabButton({
	children,
	active,
	onClick,
	icon: Icon,
}: {
	children: React.ReactNode;
	active: boolean;
	onClick: () => void;
	icon: LucideIcon;
}) {
	return (
		<motion.button
			onClick={onClick}
			whileHover={{ scale: 1.02 }}
			whileTap={{ scale: 0.98 }}
			className={cn(
				"flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors",
				active
					? "bg-background shadow-sm"
					: "text-muted-foreground hover:text-foreground",
			)}
		>
			<motion.div
				animate={{ scale: active ? 1.1 : 1 }}
				transition={springTransition}
			>
				<Icon className="w-4 h-4" />
			</motion.div>
			{children}
		</motion.button>
	);
}

export function AdminTabs({ activeTab, onTabChange }: AdminTabsProps) {
	return (
		<div className="relative flex gap-1 p-1 bg-muted/50 rounded-lg">
			<motion.div
				className="absolute top-1 bottom-1 bg-background rounded-md shadow-sm"
				initial={false}
				animate={{
					left: activeTab === "exam" ? 4 : "50%",
					width: "calc(50% - 4px)",
				}}
				transition={springTransition}
			/>
			<AnimatedTabButton
				active={activeTab === "exam"}
				onClick={() => onTabChange("exam")}
				icon={FileText}
			>
				Exam
			</AnimatedTabButton>
			<AnimatedTabButton
				active={activeTab === "subjects"}
				onClick={() => onTabChange("subjects")}
				icon={BookOpen}
			>
				Subjects
			</AnimatedTabButton>
		</div>
	);
}
