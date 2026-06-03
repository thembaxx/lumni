"use client";

import { AnimatePresence, m } from "framer-motion";
import { useState } from "react";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { Anim } from "@/components/shared/anim";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/shared";
import { getDifficultyColor } from "@/lib/utils/colors";
import { ListenToLesson } from "../listen-to-lesson";
import { PracticeButton } from "../study/practice-button";
import { useLessonCardContext } from "./lesson-card-context";

export interface LessonCardData {
	id: string;
	subject: string;
	difficulty: "easy" | "medium" | "hard";
	title: string;
	summary: string;
}

export function LessonCard({
	id,
	subject,
	difficulty,
	title,
	summary,
}: LessonCardData) {
	const { push } = useRouter();
	const { setOpenId, isOpen } = useLessonCardContext();
	const isCardOpen = isOpen(id);
	const [isPlaying, setIsPlaying] = useState(false);

	return (
		<Anim>
			<Dialog open={isCardOpen} onOpenChange={(o) => !o && setOpenId(null)}>
				<DialogContent className="max-w-sm sm:max-w-sm">
					<DialogTitle className="sr-only">{title}</DialogTitle>
					<Card className="max-h-dvh overflow-y-auto border-0 shadow-none">
						<CardContent className="p-4">
							<div className="flex flex-col gap-3">
								<div className="flex items-start justify-between">
									<Badge
										variant="outline"
										className="rounded-full bg-[--system-accent]/10 px-3 py-0.5 font-medium text-xs"
									>
										{subject}
									</Badge>
									<Badge
										className={cn(
											"ios-caption-3 rounded-full bg-[--system-accent]/10 px-3 py-0.5 font-medium uppercase",
											getDifficultyColor(difficulty),
										)}
									>
										{difficulty}
									</Badge>
								</div>

								<div className="flex flex-col gap-1">
									<h3 className="balance text-wrap font-semibold text-foreground text-xl leading-tight">
										{title}
									</h3>
									<div className="text-pretty text-muted-foreground text-sm leading-relaxed">
										<MarkdownRenderer content={summary} />
									</div>
								</div>

								<div className="flex items-center gap-2 pt-2">
									<div className={isPlaying ? "animate-pulse" : ""}>
										<ListenToLesson
											text={summary}
											onPlayingChange={setIsPlaying}
										/>
									</div>
									<PracticeButton
										onClick={() =>
											push(
												`/quiz?subject=${encodeURIComponent(subject)}&topic=${encodeURIComponent(title)}`,
											)
										}
									/>
								</div>

								<Button
									variant="outline"
									className="mt-6 w-full"
									onClick={() => setOpenId(null)}
								>
									Close
								</Button>
							</div>
						</CardContent>
					</Card>
				</DialogContent>
			</Dialog>

			<AnimatePresence mode="popLayout" initial={false}>
				{!isCardOpen && (
					<m.div key={`lesson-${id}-closed`} layoutId={`lesson-${id}`}>
						<Card className="w-full rounded-2xl text-left shadow-sm">
							<CardContent className="p-5">
								<Button
									variant="ghost"
									className="flex w-full flex-col items-start gap-3 text-left transition-[scale,colors] duration-200 active:scale-[0.96]"
									onClick={() => setOpenId(id)}
									aria-label={`${title} - ${difficulty} lesson`}
								>
									<div className="flex items-start justify-between">
										<Badge
											variant="outline"
											className="rounded-full bg-[--system-accent]/10 px-3 py-0.5 font-medium text-xs"
										>
											{subject}
										</Badge>
										<Badge
											className={cn(
												"ios-caption-3 rounded-full bg-[--system-accent]/10 px-3 py-0.5 font-medium uppercase",
												getDifficultyColor(difficulty),
											)}
										>
											{difficulty}
										</Badge>
									</div>

									<div className="flex flex-col gap-1">
										<h3 className="balance text-wrap font-semibold text-foreground text-md leading-tight">
											{title}
										</h3>
										<div className="line-clamp-2 text-pretty text-[13px] text-muted-foreground leading-relaxed">
											<MarkdownRenderer content={summary} />
										</div>
									</div>
								</Button>

								<div className="flex items-center gap-2">
									<div className={isPlaying ? "animate-pulse" : ""}>
										<ListenToLesson
											text={summary}
											onPlayingChange={setIsPlaying}
										/>
									</div>
									<PracticeButton
										onClick={() =>
											push(
												`/quiz?subject=${encodeURIComponent(subject)}&topic=${encodeURIComponent(title)}`,
											)
										}
									/>
								</div>
							</CardContent>
						</Card>
					</m.div>
				)}
			</AnimatePresence>
		</Anim>
	);
}
