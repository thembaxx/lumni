"use client";

import {
	ArrowDown01Icon,
	CheckmarkCircle01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useFilteredSubjects } from "@/hooks/use-subjects";
import { iOSEase } from "@/lib/utils/animation";
import { SubjectsDrawer } from "./drawers/subjects-drawer";

const FALLBACK = {
	subject: "Physical Sciences",
	topic: "Chemical Bonding & Molecular Structure",
	reason: "Pick a subject to find your focus area.",
	action: "Practice now",
	tag: "Needs work",
	accent: "bg-destructive",
	iconColor: "text-destructive",
	bgAlpha: "bg-destructive/15",
};

const actionConfig: Record<
	string,
	{
		tag: string;
		accent: string;
		iconColor: string;
		bgAlpha: string;
		action: string;
	}
> = {
	study: {
		tag: "Ready to start",
		accent: "bg-info",
		iconColor: "text-info",
		bgAlpha: "bg-info/15",
		action: "Study",
	},
	practice: {
		tag: "Needs work",
		accent: "bg-destructive",
		iconColor: "text-destructive",
		bgAlpha: "bg-destructive/15",
		action: "Practice now",
	},
	review: {
		tag: "Due for review",
		accent: "bg-warning",
		iconColor: "text-warning",
		bgAlpha: "bg-warning/15",
		action: "Start review",
	},
};

export function TodayFocusCard() {
	const router = useRouter();
	const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(
		null,
	);
	const [showSuccess, setShowSuccess] = useState(false);
	const shouldReduceMotion = useReducedMotion();

	const { data: subjects } = useFilteredSubjects("");
	const subjectNameById = useMemo(() => {
		const map = new Map<string, string>();
		for (const s of subjects ?? []) {
			map.set(s.id, s.name);
		}
		return map;
	}, [subjects]);

	const { data: nextTopics } = useQuery({
		queryKey: ["next-topics", selectedSubjectId],
		queryFn: async () => {
			const res = await fetch(
				`/api/engine/next-topics?subject=${encodeURIComponent(selectedSubjectId!)}`,
			);
			if (!res.ok) throw new Error("Failed to fetch focus");
			return res.json() as Promise<{
				recommendations: {
					topicId: string;
					name: string;
					level: string;
					reason: string;
					action: string;
					estimatedMinutes: number;
				}[];
			}>;
		},
		enabled: !!selectedSubjectId,
		staleTime: 1000 * 60 * 5,
	});

	const active = (nextTopics?.recommendations ?? []).find(
		(r) => r.action !== "skip",
	);

	const cfg = active
		? (actionConfig[active.action] ?? actionConfig.study)
		: FALLBACK;
	const subjectName = selectedSubjectId
		? (subjectNameById.get(selectedSubjectId) ?? selectedSubjectId)
		: FALLBACK.subject;
	const topic = active?.name ?? FALLBACK.topic;
	const reason = active
		? active.reason === "ready-to-start"
			? "You're ready for this topic. Give it a try."
			: active.reason === "needs-practice"
				? "Needs more practice to reach proficiency. Keep at it!"
				: "Time to review this topic and lock it in."
		: FALLBACK.reason;

	function handleStart() {
		setShowSuccess(true);
		setTimeout(() => {
			router.push(
				`/quiz?subject=${encodeURIComponent(subjectName)}&topic=${encodeURIComponent(topic)}`,
			);
		}, 600);
	}

	useEffect(() => {
		if (showSuccess) {
			const t = setTimeout(() => setShowSuccess(false), 600);
			return () => clearTimeout(t);
		}
	}, [showSuccess]);

	return (
		<motion.div
			initial={{ opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{
				duration: shouldReduceMotion ? 0 : 0.35,
				ease: iOSEase,
			}}
		>
			<Card className="border border-border/80 hover:border-border/80 transition-colors">
				<div className="p-5 space-y-4">
					<div className="flex items-center gap-3">
						<div
							className={`flex items-center justify-center border size-10 rounded-xl ${cfg.bgAlpha}`}
						>
							<HugeiconsIcon
								icon={CheckmarkCircle01Icon}
								className={`size-5 ${cfg.iconColor}`}
							/>
						</div>
						<div className="space-y-0.5">
							<span className="text-[13px] font-bold text-foreground tracking-tight block">
								Today&apos;s Focus
							</span>
							<span className={`text-[12px] font-medium ${cfg.iconColor}`}>
								{cfg.tag}
							</span>
						</div>
					</div>

					<div className="space-y-4">
						<div className="flex justify-between items-center gap-2">
							<p className="text-[13px] text-primary font-semibold">
								{subjectName}
							</p>
							<SubjectsDrawer
								onSelect={(name) => {
									const found = subjects?.find((s) => s.name === name);
									if (found) setSelectedSubjectId(found.id);
								}}
							>
								<div className="flex items-center text-[12px] text-muted-foreground border rounded-sm pl-2 pr-1.5 py-1 hover:text-foreground cursor-pointer transition-colors font-medium p-2 -m-2">
									change subject
									<HugeiconsIcon
										icon={ArrowDown01Icon}
										className="size-4 ml-2"
									/>
								</div>
							</SubjectsDrawer>
						</div>
						<h3 className="text-lg font-bold text-foreground leading-tight tracking-tight text-wrap balance">
							{topic}
						</h3>
					</div>

					<p className="text-xs text-muted-foreground leading-relaxed font-medium">
						{reason}
					</p>

					<Button
						size="sm"
						variant="secondary"
						className="w-full font-bold bg-black/10 dark:bg-white/10 text-[13px] h-10 hover:opacity-90"
						onClick={handleStart}
						disabled={showSuccess}
					>
						<AnimatePresence mode="wait" initial={false}>
							{showSuccess ? (
								<motion.span
									key="success"
									initial={{ scale: 0.8, opacity: 0 }}
									animate={{ scale: 1, opacity: 1 }}
									exit={{ y: 4, opacity: 0, scale: 0.96 }}
									transition={{
										duration: shouldReduceMotion ? 0 : 0.25,
										ease: iOSEase,
									}}
									className="flex items-center gap-1.5"
								>
									<HugeiconsIcon
										icon={CheckmarkCircle01Icon}
										className="size-3.5"
									/>
									Starting quiz...
								</motion.span>
							) : (
								<motion.span
									key="action"
									initial={{ scale: 0.8, opacity: 0 }}
									animate={{ scale: 1, opacity: 1 }}
									exit={{ y: 4, opacity: 0, scale: 0.96 }}
									transition={{
										duration: shouldReduceMotion ? 0 : 0.2,
										ease: iOSEase,
									}}
								>
									{cfg.action}
								</motion.span>
							)}
						</AnimatePresence>
					</Button>
				</div>
			</Card>
		</motion.div>
	);
}
