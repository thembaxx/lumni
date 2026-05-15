"use client";

import { AnimatePresence, m } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
	const router = useRouter();
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
						className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
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
						className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2"
					>
						<Card className="max-h-[80dvh] overflow-y-auto p-4">
							<div className="flex flex-col gap-3">
								<div className="flex justify-between items-start">
									<Badge
										variant="outline"
										className="px-3 py-0.5 text-xs font-medium bg-[--system-accent]/10 rounded-full"
									>
										{subject}
									</Badge>
									<Badge
										className={cn(
											"px-3 py-0.5 text-[10px] uppercase font-medium bg-[--system-accent]/10 rounded-full",
											getDifficultyColor(difficulty),
										)}
									>
										{difficulty}
									</Badge>
								</div>

								<div className="flex flex-col gap-1">
									<h3 className="text-xl font-semibold leading-tight text-foreground text-wrap balance">
										{title}
									</h3>
									<div className="text-sm text-muted-foreground leading-relaxed text-pretty">
										<MarkdownRenderer content={summary} />
									</div>
								</div>

								<div className="flex gap-2 items-center pt-2">
									<div className={isPlaying ? "animate-pulse" : ""}>
										<ListenToLesson
											text={summary}
											onPlayingChange={setIsPlaying}
										/>
									</div>
									<PracticeButton
										onClick={() =>
											router.push(
												`/quiz?subject=${encodeURIComponent(subject)}&topic=${encodeURIComponent(title)}`,
											)
										}
									/>
								</div>

								<Button
									variant="outline"
									className="w-full mt-6"
									onClick={() => setOpenId(null)}
								>
									Close
								</Button>
							</div>
						</Card>
					</m.div>
				) : (
					<m.div key={`lesson-${id}-closed`} layoutId={`lesson-${id}`}>
						<Card className="p-5 rounded-2xl shadow-sm w-full text-left">
							<div
								onClick={() => setOpenId(id)}
								className="flex flex-col gap-3 cursor-pointer hover:border-[--system-accent]/20 transition-[scale,colors] duration-200 active:scale-[0.98]"
								role="button"
								tabIndex={0}
								onKeyDown={(e) => {
									if (e.key === "Enter" || e.key === " ") {
										e.preventDefault();
										setOpenId(id);
									}
								}}
								aria-label={`${title} - ${difficulty} lesson`}
							>
								<div className="flex justify-between items-start">
									<Badge
										variant="outline"
										className="px-3 py-0.5 text-xs font-medium bg-[--system-accent]/10 rounded-full"
									>
										{subject}
									</Badge>
									<Badge
										className={cn(
											"px-3 py-0.5 text-[10px] uppercase font-medium bg-[--system-accent]/10 rounded-full",
											getDifficultyColor(difficulty),
										)}
									>
										{difficulty}
									</Badge>
								</div>

								<div className="flex flex-col gap-1">
									<h3 className="text-md font-semibold leading-tight text-foreground text-wrap balance">
										{title}
									</h3>
									<div className="text-[13px] text-muted-foreground leading-relaxed text-pretty line-clamp-2">
										<MarkdownRenderer content={summary} />
									</div>
								</div>
							</div>

							<div className="flex gap-2 items-center mt-3">
								<div className={isPlaying ? "animate-pulse" : ""}>
									<ListenToLesson
										text={summary}
										onPlayingChange={setIsPlaying}
									/>
								</div>
								<PracticeButton
									onClick={() =>
										router.push(
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
