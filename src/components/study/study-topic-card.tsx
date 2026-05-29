"use client";

import { DiceIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, m } from "framer-motion";
import { useMemo, useState } from "react";
import { ListenToLesson } from "@/components/listen-to-lesson";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { Anim } from "@/components/shared/anim";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/shared";
import { iOSEase } from "@/lib/utils/animation";
import { getDifficultyColor } from "@/lib/utils/colors";
import { Badge } from "../ui/badge";
import { PracticeButton } from "./practice-button";
import { getRandomTopic, type TopicData } from "./study-topic-card.data";

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
	const { push } = useRouter();
	const [isPlaying, setIsPlaying] = useState(false);
	const [, setWordIndex] = useState(0);
	const [triggerIndex, setTriggerIndex] = useState(0);

	const topic = useMemo(
		() => initialTopic ?? getRandomTopic(),
		[initialTopic, triggerIndex],
	);

	const handleRefresh = () => {
		setIsPlaying(false);
		setTriggerIndex((i) => i + 1);
	};

	if (!topic) {
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
						"rounded-2xl border bg-transparent p-5 text-card-foreground shadow-sm",
						"flex flex-col gap-4",
						className,
					)}
				>
					<m.div
						variants={variants}
						transition={{ delay: 0.05 }}
						className="flex items-start justify-between"
					>
						<Badge
							variant="outline"
							className="rounded-full border-none bg-[--system-accent]/10 px-3 py-0.5 font-medium text-[10px]"
						>
							{topic.subject}
						</Badge>
						<Badge
							className={cn(
								"rounded-full px-3 py-0.5 font-medium text-[10px] uppercase",
								getDifficultyColor(topic.difficulty),
							)}
						>
							{topic.difficulty}
						</Badge>
					</m.div>

					<m.h3
						variants={variants}
						transition={{ delay: 0.1 }}
						className="balance text-wrap font-semibold text-foreground text-lg leading-tight tracking-tight"
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
							className="text-muted-foreground text-sm leading-relaxed"
						/>
					</m.div>

					<m.div
						variants={variants}
						transition={{ delay: 0.2 }}
						className="flex items-center justify-between gap-2 pt-1"
					>
						<div className={isPlaying ? "animate-pulse" : ""}>
							<ListenToLesson
								text={topic.summary}
								onPlayingChange={setIsPlaying}
								onWordIndexChange={setWordIndex}
							/>
						</div>
						<PracticeButton
							onClick={() =>
								topic &&
								push(
									`/quiz?subject=${encodeURIComponent(topic.subject)}&topic=${encodeURIComponent(topic.topicTitle)}`,
								)
							}
						/>
						<Button
							size="sm"
							variant="ghost"
							onClick={handleRefresh}
							className={cn(
								"rounded-lg px-3 text-xs",
								"transition-transform active:scale-[0.96]",
								"transition-colors duration-150 ease-[var(--ease-ios)]",
							)}
							aria-label="Get new topic"
						>
							<HugeiconsIcon icon={DiceIcon} data-icon="inline-start" />
						</Button>
					</m.div>
				</m.div>
			</AnimatePresence>
		</Anim>
	);
}
