"use client";

import { motion } from "framer-motion";

interface AdminStatCardsProps {
	subjectsCount: number;
	selectedCount: number;
}

function AnimatedStatCard({
	label,
	value,
	delay = 0,
}: {
	label: string;
	value: number;
	delay?: number;
}) {
	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.95 }}
			animate={{ opacity: 1, scale: 1 }}
			transition={{ delay, duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
			className="p-3 rounded-lg bg-muted/50"
		>
			<p className="text-xs text-muted-foreground">{label}</p>
			<motion.p
				className="text-xl font-semibold tabular-nums"
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: delay + 0.15 }}
			>
				{value}
			</motion.p>
		</motion.div>
	);
}

export function AdminStatCards({
	subjectsCount,
	selectedCount,
}: AdminStatCardsProps) {
	return (
		<div className="grid grid-cols-2 gap-3">
			<AnimatedStatCard label="Subjects" value={subjectsCount} delay={0} />
			<AnimatedStatCard label="Selected" value={selectedCount} delay={0.05} />
		</div>
	);
}
