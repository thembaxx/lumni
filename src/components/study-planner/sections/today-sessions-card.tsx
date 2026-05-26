"use client";

import {
	Calendar01Icon,
	CheckmarkCircle01Icon,
	Delete02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { StudySession as StudySessionType } from "@/lib/utils/study-planner";

export function TodaySessionsCard({
	sessions,
	onComplete,
	onDelete,
}: {
	sessions: StudySessionType[];
	onComplete: (id: string) => void;
	onDelete: (id: string) => void;
}) {
	const t = useTranslations();
	return (
		<div className="overflow-hidden rounded-card-lg border border-border/80 bg-card shadow-level-2 transition-colors">
			<header className="rounded-t-card-lg border-border/80 border-t pb-2">
				<h2 className="flex items-center gap-2 font-heading font-medium text-base text-sm">
					<HugeiconsIcon icon={Calendar01Icon} className="size-4" />
					{t("studyPlanner.today")}
				</h2>
			</header>
			<div className="px-4 group-data-[size=sm]/card:px-3">
				{sessions.length === 0 ? (
					<p className="py-4 text-center text-muted-foreground text-sm">
						{t("studyPlanner.noSessionsToday")}
					</p>
				) : (
					<div className="flex flex-col gap-2">
						{sessions.map((session) => (
							<div
								key={session.id}
								className="flex items-center justify-between rounded-lg bg-muted p-3"
							>
								<div className="flex items-center gap-3">
									<Button
										variant="ghost"
										size="icon-xs"
										onClick={() => onComplete(session.id)}
										aria-label={t("studyPlanner.markComplete")}
										className={`rounded-full ${
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
									<div>
										<p className="font-medium text-sm">{session.subject}</p>
										<p className="text-muted-foreground text-xs">
											{session.topic || session.type} • {session.duration}min
										</p>
									</div>
								</div>
								<Button
									variant="ghost"
									size="icon-xs"
									onClick={() => onDelete(session.id)}
									aria-label={t("studyPlanner.deleteSession")}
								>
									<HugeiconsIcon icon={Delete02Icon} className="size-4" />
								</Button>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
