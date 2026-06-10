"use client";

import { CheckmarkCircle01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { m } from "framer-motion";
import { useTranslations } from "next-intl";
import { AnimatedProgressBar } from "@/components/shared/animated-progress-bar";
import { iOSDecelerate } from "@/lib/utils/animation";
import type { DailyChallenge } from "@/types/gamification";

interface DailyChallengesProps {
	challenges: DailyChallenge[];
}

const VARIANTS = {
	hidden: { opacity: 0, x: -8, scale: 0.97 },
	visible: (i: number) => ({
		opacity: 1,
		x: 0,
		scale: 1,
		transition: { duration: 0.4, ease: iOSDecelerate, delay: i * 0.08 },
	}),
};

function _DailyChallenges({ challenges }: DailyChallengesProps) {
	const t = useTranslations();
	const completedCount = challenges.filter((c) => c.completed).length;
	const allCompleted = completedCount === challenges.length;

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2.5">
					<span className="font-semibold text-foreground text-sm">
						{t("gamification.dailyChallenges")}
					</span>
					{allCompleted && (
						<m.span
							initial={{ scale: 0.9, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							transition={{ duration: 0.3, ease: iOSDecelerate }}
							className="rounded-full bg-success/15 px-2.5 py-0.5 font-semibold text-success-foreground text-xs"
						>
							{t("gamification.complete")}
						</m.span>
					)}
				</div>
				<span className="text-muted-foreground text-xs tabular-nums">
					{t("gamification.completedOfTotal", {
						completed: completedCount,
						total: challenges.length,
					})}
				</span>
			</div>

			<div className="flex flex-col gap-2.5">
				{challenges.map((challenge, index) => (
					<m.div
						key={challenge.id}
						variants={VARIANTS}
						initial="hidden"
						animate="visible"
						custom={index}
						className={`relative overflow-hidden rounded-2xl p-4 transition-[background-color] duration-300 ${
							challenge.completed
								? "bg-success/8 ring-1 ring-success/15"
								: "bg-card ring-1 ring-border/50 hover:ring-[--system-accent]/25"
						}`}
					>
						<div className="flex items-start gap-4">
							<div
								className={`flex size-10 shrink-0 items-center justify-center rounded-xl text-lg ${
									challenge.completed
										? "bg-success/20 text-success"
										: "bg-muted text-muted-foreground"
								}`}
							>
								{challenge.completed ? (
									<m.div
										initial={{ scale: 0.95, opacity: 0, rotate: -45 }}
										animate={{ scale: 1, opacity: 1, rotate: 0 }}
										transition={{ duration: 0.35, ease: iOSDecelerate }}
									>
										<HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} />
									</m.div>
								) : (
									<span className="text-base">{challenge.icon}</span>
								)}
							</div>

							<div className="flex min-w-0 flex-1 flex-col gap-1.5">
								<div className="flex items-center justify-between gap-2">
									<span
										className={`text-balance font-semibold text-sm leading-tight ${
											challenge.completed
												? "text-success-foreground"
												: "text-foreground"
										}`}
									>
										{challenge.title}
									</span>
									<span className="shrink-0 text-muted-foreground text-xs tabular-nums">
										{t("gamification.xpReward", {
											xpReward: challenge.xpReward,
										})}
									</span>
								</div>

								<p className="text-muted-foreground text-xs leading-relaxed">
									{challenge.description}
								</p>

								{!challenge.completed && challenge.type === "questions" && (
									<div className="pt-1">
										<AnimatedProgressBar
											value={(challenge.progress / challenge.target) * 100}
											size="md"
											color="accent"
											trackClassName="bg-secondary"
										/>
									</div>
								)}

								{challenge.completed && (
									<m.div
										initial={{ scale: 0.95, opacity: 0 }}
										animate={{ scale: 1, opacity: 1 }}
										transition={{ duration: 0.35, ease: iOSDecelerate }}
										className="flex items-center gap-1.5 pt-0.5 text-success-foreground text-xs"
									>
										<HugeiconsIcon icon={CheckmarkCircle01Icon} size={12} />
										{t("gamification.completed")}
									</m.div>
								)}
							</div>
						</div>
					</m.div>
				))}
			</div>
		</div>
	);
}
