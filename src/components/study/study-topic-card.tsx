"use client";

import { DiceFive } from "@phosphor-icons/react";
import { AnimatePresence, m } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ListenToLesson } from "@/components/listen-to-lesson";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { Anim } from "@/components/shared/anim";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { iOSEase } from "@/lib/utils/animation";
import { getDifficultyColor } from "@/lib/utils/colors";
import { Badge } from "../ui/badge";
import { PracticeButton } from "./practice-button";
import { getRandomTopic, TopicData } from "./study-topic-card.data";

interface StudyTopicCardProps {
	className?: string;
	initialTopic?: TopicData;
	onLearnMore?: () => void;
}

const variants = {
	hidden: { opacity: 0, y: 8 },
	visible: { opacity: 1, y: 0 },
};

export function StudyTopicCard({
	className,
	initialTopic,
}: StudyTopicCardProps) {
	const router = useRouter();
	const [topic, setTopic] = useState<TopicData | null>(null);
	const [isPlaying, setIsPlaying] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	const initializeTopic = useCallback(() => {
		const randomTopic = initialTopic || getRandomTopic();
		setTopic(randomTopic);
		setIsLoading(false);
	}, [initialTopic]);

	useEffect(() => {
		initializeTopic();
	}, [initializeTopic]);

	const handleRefresh = () => {
		setIsPlaying(false);
		setIsLoading(true);
		initializeTopic();
	};

	if (isLoading || !topic) {
		return (
			<Card className={cn(className)}>
				<CardContent className="flex flex-col gap-4">
					<div className="flex gap-2">
						<Skeleton className="h-6 w-20 rounded-full" />
						<Skeleton className="h-6 w-16 rounded-full" />
					</div>
					<Skeleton className="h-7 w-2/3 rounded-lg" />
					<div className="flex flex-col gap-2">
						<Skeleton className="h-4 rounded" />
						<Skeleton className="h-4 rounded" />
						<Skeleton className="h-4 w-5/6 rounded" />
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Anim>
			<AnimatePresence mode="wait" initial={false}>
				<m.div
					key={topic.topicTitle}
					variants={variants}
					initial="hidden"
					animate="visible"
					exit="hidden"
					transition={{ duration: 0.2, ease: iOSEase }}
					className={cn(
						"p-5 rounded-2xl border bg-transparent text-card-foreground shadow-sm",
						"flex flex-col gap-4",
						className,
					)}
				>
					<m.div
						variants={variants}
						transition={{ delay: 0.05 }}
						className="flex justify-between items-start"
					>
						<Badge
							variant="outline"
							className="px-3 py-0.5 text-[10px] font-medium bg-[--system-accent]/10 rounded-full border-none"
						>
							{topic.subject}
						</Badge>
						<Badge
							className={cn(
								"px-3 py-0.5 text-[10px] uppercase font-medium rounded-full",
								getDifficultyColor(topic.difficulty),
							)}
						>
							{topic.difficulty}
						</Badge>
					</m.div>

					<m.h3
						variants={variants}
						transition={{ delay: 0.1 }}
						className="text-lg font-semibold leading-tight text-foreground text-wrap balance tracking-tight"
					>
						{topic.topicTitle}
					</m.h3>

					<m.div
						variants={variants}
						transition={{ delay: 0.15 }}
						className="flex flex-col gap-1"
					>
						<MarkdownRenderer
							content={topic.summary}
							subject={topic.subject}
							className="text-sm text-muted-foreground leading-relaxed"
						/>
					</m.div>

					<m.div
						variants={variants}
						transition={{ delay: 0.2 }}
						className="flex gap-2 justify-between items-center pt-1"
					>
						<div className={isPlaying ? "animate-pulse" : ""}>
							<ListenToLesson
								text={topic.summary}
								onPlayingChange={setIsPlaying}
								// Note: Word index highlighting removed due to MarkdownRenderer usage
								// To preserve exact word highlighting, would need a more complex solution
								// that maps word positions in rendered markdown back to raw text
								onWordIndexChange={() => {}}
							/>
						</div>
						<PracticeButton
							onClick={() =>
								topic &&
								router.push(
									`/quiz?subject=${encodeURIComponent(topic.subject)}&topic=${encodeURIComponent(topic.topicTitle)}`,
								)
							}
						/>
						<Button
							size="sm"
							variant="ghost"
							onClick={handleRefresh}
							className={cn(
								"h-8 px-3 text-xs rounded-lg",
								"active:scale-[0.96] transition-transform",
								"transition-colors duration-150 ease-[var(--ease-ios)]",
							)}
							aria-label="Get new topic"
						>
							<DiceFive data-icon="inline-start" />
						</Button>
					</m.div>
				</m.div>
			</AnimatePresence>
		</Anim>
	);
}
