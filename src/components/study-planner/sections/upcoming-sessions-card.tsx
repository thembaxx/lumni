"use client";

import {
	CheckmarkCircle01Icon,
	Clock01Icon,
	Delete02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { StudySession as StudySessionType } from "@/lib/utils/study-planner";

export function UpcomingSessionsCard({
	sessions,
	onComplete,
	onDelete,
	onStart,
}: {
	sessions: StudySessionType[];
	onComplete: (id: string) => void;
	onDelete: (id: string) => void;
	onStart?: (session: StudySessionType) => void;
}) {
	const t = useTranslations();
	const groupedByDate = sessions.reduce<Record<string, StudySessionType[]>>(
		(acc, session) => {
			const date = new Date(session.scheduledAt).toLocaleDateString("en", {
				weekday: "long",
				month: "short",
				day: "numeric",
			});
			if (!acc[date]) acc[date] = [];
			acc[date].push(session);
			return acc;
		},
		{},
	);

	return (
		<div className="overflow-hidden rounded-card-lg border border-border/80 bg-card shadow-level-2 transition-colors">
			<header className="rounded-t-card-lg border-border/80 border-t pb-2">
				<h2 className="flex items-center gap-2 font-medium font-sans text-base">
					<HugeiconsIcon icon={Clock01Icon} className="size-4" />
					{t("studyPlanner.upcomingSessions")}
				</h2>
			</header>
			<div className="px-4 group-data-[size=sm]/card:px-3">
				{Object.keys(groupedByDate).length === 0 ? (
					<p className="py-4 text-center text-muted-foreground text-sm">
						{t("studyPlanner.noUpcomingSessions")}
					</p>
				) : (
					<div className="flex flex-col gap-4">
						{Object.entries(groupedByDate).map(
							([date, daySessions]: [string, StudySessionType[]]) => (
								<div key={date}>
									<h3 className="mb-2 font-medium text-muted-foreground text-sm">
										{date}
									</h3>
									<div className="flex flex-col gap-2">
										{daySessions.map((session) => (
											<div
												key={session.id}
												className="flex items-center justify-between rounded-lg bg-muted p-3"
											>
												<div className="flex min-w-0 flex-1 items-center gap-3">
													<Button
														variant="ghost"
														size="icon-xs"
														onClick={(e) => {
															e.stopPropagation();
															onComplete(session.id);
														}}
														aria-label={t("studyPlanner.markComplete")}
														className={`shrink-0 rounded-full ${
															session.completed
																? "bg-success text-success-foreground hover:bg-success/90 dark:bg-success/70 dark:hover:bg-success/60"
																: "border-muted-foreground"
														}`}
													>
														{session.completed && (
															<HugeiconsIcon
																icon={CheckmarkCircle01Icon}
																className="size-3"
															/>
														)}
													</Button>
													<button
														type="button"
														onClick={() => onStart?.(session)}
														className="min-w-0 flex-1 text-left"
													>
														<p className="truncate font-medium text-sm">
															{session.subject}
														</p>
														<p className="truncate text-muted-foreground text-xs">
															{session.topic || session.type} •{" "}
															{session.duration}min
														</p>
													</button>
												</div>
												<Button
													variant="ghost"
													size="icon-xs"
													onClick={(e) => {
														e.stopPropagation();
														onDelete(session.id);
													}}
													aria-label={t("studyPlanner.deleteSession")}
												>
													<HugeiconsIcon
														icon={Delete02Icon}
														className="size-4"
													/>
												</Button>
											</div>
										))}
									</div>
								</div>
							),
						)}
					</div>
				)}
			</div>
		</div>
	);
}
