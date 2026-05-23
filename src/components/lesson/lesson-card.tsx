"use client";

import { AnimatePresence, m } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { Anim } from "@/components/shared/anim";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
			<AnimatePresence initial={false}>
				{isCardOpen && (
					<m.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 z-modal bg-black/40 backdrop-blur-sm"
						onClick={() => setOpenId(null)}
						role="presentation"
					/>
				)}
			</AnimatePresence>

			<AnimatePresence mode="popLayout" initial={false}>
				{isCardOpen ? (
					<m.div
						key={`lesson-${id}-open`}
						layoutId={`lesson-${id}`}
						className="fixed top-1/2 left-1/2 z-modal w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2"
					>
						<Card className="max-h-[80dvh] overflow-y-auto p-4">
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
											"rounded-full bg-[--system-accent]/10 px-3 py-0.5 font-medium text-[10px] uppercase",
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
						</Card>
					</m.div>
				) : (
					<m.div key={`lesson-${id}-closed`} layoutId={`lesson-${id}`}>
						<Card className="w-full rounded-2xl p-5 text-left shadow-sm">
							<button
								type="button"
								onClick={() => setOpenId(id)}
								className="flex w-full flex-col gap-3 text-left transition-[scale,colors] duration-200 hover:border-[--system-accent]/20 active:scale-[0.96]"
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
											"rounded-full bg-[--system-accent]/10 px-3 py-0.5 font-medium text-[10px] uppercase",
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
							</button>

							<div className="mt-3 flex items-center gap-2">
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
						</Card>
					</m.div>
				)}
			</AnimatePresence>
		</Anim>
	);
}
