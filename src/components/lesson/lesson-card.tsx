"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getDifficultyColor } from "@/components/study/study-topic-card.data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
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
	const [currentWordIndex, setCurrentWordIndex] = useState(-1);
	const [words, setWords] = useState<string[]>([]);

	useEffect(() => {
		setWords(summary.split(" "));
	}, [summary]);

	return (
		<>
			<AnimatePresence>
				{isCardOpen && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
						onClick={() => setOpenId(null)}
					/>
				)}
			</AnimatePresence>

			<AnimatePresence mode="popLayout">
				{isCardOpen ? (
					<motion.div
						key={`lesson-${id}-open`}
						layoutId={`lesson-${id}`}
						className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2"
					>
						<Card className="p-4 rounded-2xl border bg-card text-card-foreground shadow-2xl shadow-black/20 max-h-[80dvh] overflow-y-auto">
							<div className="space-y-3">
								<div className="flex justify-between items-start">
									<Badge
										variant="outline"
										className="px-3 py-0.5 text-xs font-medium bg-primary/10 rounded-full"
									>
										{subject}
									</Badge>
									<Badge
										className={cn(
											"px-3 py-0.5 text-[10px] uppercase font-medium bg-primary/10 rounded-full",
											getDifficultyColor(difficulty),
										)}
									>
										{difficulty}
									</Badge>
								</div>

								<div className="space-y-1">
									<h3 className="text-xl font-semibold leading-tight text-foreground text-wrap balance">
										{title}
									</h3>
									<p className="text-sm text-muted-foreground leading-relaxed text-pretty">
										{words.map((word, index) => (
											<span
												key={index}
												className={cn(
													"transition-colors duration-150 ease-out-quart",
													index === currentWordIndex &&
														"text-primary font-medium bg-primary/10 rounded px-0.5 -mx-0.5",
												)}
											>
												{word}
												{index < words.length - 1 && " "}
											</span>
										))}
									</p>
								</div>

								<div className="flex gap-2 items-center pt-2">
									<div className={isPlaying ? "animate-pulse" : ""}>
										<ListenToLesson
											text={summary}
											onPlayingChange={setIsPlaying}
											onWordIndexChange={setCurrentWordIndex}
										/>
									</div>
									<PracticeButton onClick={() => router.push("/quiz")} />
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
					</motion.div>
				) : (
					<Card
						key={`lesson-${id}-closed`}
						onClick={() => setOpenId(id)}
						className="p-5 rounded-2xl border bg-card text-card-foreground shadow-sm hover:border-primary/20 transition-all duration-200 cursor-pointer"
					>
						<motion.div layoutId={`lesson-${id}`} className="space-y-3">
							<div className="flex justify-between items-start">
								<Badge
									variant="outline"
									className="px-3 py-0.5 text-xs font-medium bg-primary/10 rounded-full"
								>
									{subject}
								</Badge>
								<Badge
									className={cn(
										"px-3 py-0.5 text-[10px] uppercase font-medium bg-primary/10 rounded-full",
										getDifficultyColor(difficulty),
									)}
								>
									{difficulty}
								</Badge>
							</div>

							<div className="space-y-1">
								<h3 className="text-md font-semibold leading-tight text-foreground text-wrap balance">
									{title}
								</h3>
								<p className="text-[13px] text-muted-foreground leading-relaxed text-pretty line-clamp-2">
									{words.map((word, index) => (
										<span
											key={index}
											className={cn(
												"transition-colors duration-150 ease-out-quart",
												index === currentWordIndex &&
													"text-primary font-medium bg-primary/10 rounded px-0.5 -mx-0.5",
											)}
										>
											{word}
											{index < words.length - 1 && " "}
										</span>
									))}
								</p>
							</div>

							<div className="flex gap-2 items-center">
								<div className={isPlaying ? "animate-pulse" : ""}>
									<ListenToLesson
										text={summary}
										onPlayingChange={setIsPlaying}
										onWordIndexChange={setCurrentWordIndex}
									/>
								</div>
								<PracticeButton onClick={() => router.push("/quiz")} />
							</div>
						</motion.div>
					</Card>
				)}
			</AnimatePresence>
		</>
	);
}
