"use client";

import { SparklesIcon, ZapIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { m } from "framer-motion";
import { useCallback, useMemo, useState } from "react";
import type { BoltResult } from "@/components/dashboard/daily-challenge-dialog";
import {
	DailyChallengeDialog,
	resolveWeakestSubject,
} from "@/components/dashboard/daily-challenge-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChallengeDialog } from "@/components/ui/challenge-dialog";
import { useGamification } from "@/hooks/use-gamification";

interface DailyChallengeCardProps {
	onComplete: (result: BoltResult) => void;
	streak: number;
}

function formatSubjectLabel(subject: string): string {
	return subject
		.split(/[-_\s]+/)
		.filter(Boolean)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");
}

export function DailyChallengeCard({
	onComplete,
	streak,
}: DailyChallengeCardProps) {
	const { gamification } = useGamification();
	const [isOpen, setIsOpen] = useState(false);
	const [subject, setSubject] = useState("mathematics");

	const todayStr = useMemo(() => new Date().toDateString(), []);
	const isDue = gamification.lastPracticeDate !== todayStr;

	const subjectLabel = useMemo(() => formatSubjectLabel(subject), [subject]);

	const handleOpen = useCallback(async () => {
		const weakest = await resolveWeakestSubject();
		setSubject(weakest);
		setIsOpen(true);
	}, []);

	const handleClose = useCallback(() => {
		setIsOpen(false);
	}, []);

	const handleComplete = useCallback(
		(result: BoltResult) => {
			onComplete(result);
		},
		[onComplete],
	);

	if (!isDue) return null;

	return (
		<div className="card-entrance">
			<ChallengeDialog open={isOpen} onClose={handleClose} layoutId="">
				<DailyChallengeDialog
					subject={subject}
					onComplete={handleComplete}
					onClose={handleClose}
					streak={streak}
				/>
			</ChallengeDialog>

			{!isOpen && (
				<m.div layoutId="daily-challenge">
					<Card className="overflow-hidden rounded-2xl shadow-level-1 ring-1 ring-warning/15 transition-[background-color] duration-300 hover:bg-muted/30">
						<CardContent className="flex items-center gap-4 p-5">
							<div className="relative flex size-12 shrink-0 items-center justify-center rounded-2xl bg-warning/15">
								<m.div
									animate={{
										scale: [1, 1.06, 1],
										opacity: [0.55, 0.85, 0.55],
									}}
									transition={{
										duration: 2.4,
										repeat: 2,
										ease: "easeInOut",
									}}
									className="absolute inset-0 rounded-2xl bg-warning/30 blur-md"
								/>
								<HugeiconsIcon
									icon={SparklesIcon}
									className="relative size-6 text-warning"
									strokeWidth={2.25}
								/>
							</div>
							<div className="flex min-w-0 flex-1 flex-col gap-1">
								<div className="flex items-center gap-2">
									<h3 className="font-extrabold font-heading text-sm text-system-text-primary tracking-tight">
										Today&rsquo;s Challenge
									</h3>
									{streak > 1 && (
										<div className="flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5">
											<HugeiconsIcon
												icon={ZapIcon}
												className="size-3 text-warning"
												strokeWidth={2.5}
											/>
											<span className="font-semibold text-[10px] text-warning tabular-nums">
												{streak}x
											</span>
										</div>
									)}
								</div>
								<p className="truncate text-muted-foreground text-xs">
									{subjectLabel} &mdash; your weakest subject
								</p>
							</div>
							<Button
								size="sm"
								className="shrink-0 gap-1.5"
								onClick={handleOpen}
							>
								Take Challenge
							</Button>
						</CardContent>
					</Card>
				</m.div>
			)}
		</div>
	);
}
