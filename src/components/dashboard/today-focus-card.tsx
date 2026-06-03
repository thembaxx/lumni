"use client";

import {
	ArrowDown01Icon,
	CheckmarkCircle01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useFilteredSubjects } from "@/hooks/use-subjects";
import { useRouter } from "@/i18n/navigation";
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
	const { push } = useRouter();
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
				`/api/engine/next-topics?subject=${encodeURIComponent(selectedSubjectId ?? "")}`,
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
			push(
				`/quiz?subject=${encodeURIComponent(subjectName)}&topic=${encodeURIComponent(topic)}&count=10`,
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
		<m.div
			initial={{ opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{
				duration: shouldReduceMotion ? 0 : 0.35,
				ease: iOSEase,
			}}
		>
			<Card className="border border-border/80 transition-colors hover:border-foreground/15">
				<div className="flex flex-col gap-4 p-5">
					<div className="flex items-center gap-3">
						<div
							className={`flex size-10 items-center justify-center rounded-xl border ${cfg.bgAlpha}`}
						>
							<HugeiconsIcon
								icon={CheckmarkCircle01Icon}
								className={`size-5 ${cfg.iconColor}`}
							/>
						</div>
						<div className="flex flex-col gap-0.5">
							<span className="block font-extrabold text-foreground text-sm tracking-tight">
								Today&apos;s Focus
							</span>
							<span className={`font-medium text-xs ${cfg.iconColor}`}>
								{cfg.tag}
							</span>
						</div>
					</div>

					<div className="flex flex-col gap-4">
						<div className="flex items-center justify-between gap-2">
							<p className="font-semibold text-primary text-sm">
								{subjectName}
							</p>
							<SubjectsDrawer
								onSelect={(name) => {
									const found = subjects?.find((s) => s.name === name);
									if (found) setSelectedSubjectId(found.id);
								}}
							>
								<div className="flex min-h-9 cursor-pointer items-center gap-1 rounded-lg border px-3 py-1.5 font-medium text-muted-foreground text-xs transition-[background-color,color] hover:bg-system-fill hover:text-foreground">
									Change subject
									<HugeiconsIcon
										icon={ArrowDown01Icon}
										className="ml-2 size-4"
									/>
								</div>
							</SubjectsDrawer>
						</div>
						<h3 className="balance text-wrap font-semibold text-foreground text-lg leading-tight tracking-tight">
							{topic}
						</h3>
					</div>

					<p className="font-medium text-muted-foreground text-xs leading-relaxed">
						{reason}
					</p>

					<Button
						size="sm"
						variant="secondary"
						className="w-full bg-system-fill font-extrabold text-sm transition-[background-color,opacity] hover:opacity-90 active:scale-[0.96]"
						onClick={handleStart}
						disabled={showSuccess}
					>
						<AnimatePresence mode="wait" initial={false}>
							{showSuccess ? (
								<m.span
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
									<HugeiconsIcon icon={CheckmarkCircle01Icon} />
									Starting quiz…
								</m.span>
							) : (
								<m.span
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
								</m.span>
							)}
						</AnimatePresence>
					</Button>
				</div>
			</Card>
		</m.div>
	);
}
