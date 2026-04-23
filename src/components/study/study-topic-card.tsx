"use client";

import { Dice5 } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, domAnimation, LazyMotion, m } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ListenToLesson } from "@/components/listen-to-lesson";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/badge";
import { PracticeButton } from "./practice-button";
import {
	getDifficultyColor,
	getRandomTopic,
	TopicData,
} from "./study-topic-card.data";

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
	const [currentWordIndex, setCurrentWordIndex] = useState(-1);
	const [words, setWords] = useState<string[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	const initializeTopic = useCallback(() => {
		const randomTopic = initialTopic || getRandomTopic();
		setTopic(randomTopic);
		setWords(randomTopic.summary.split(" "));
		setIsLoading(false);
	}, [initialTopic]);

	useEffect(() => {
		initializeTopic();
	}, [initializeTopic]);

	const handleRefresh = () => {
		setIsPlaying(false);
		setCurrentWordIndex(-1);
		setIsLoading(true);
		initializeTopic();
	};

	if (isLoading || !topic) {
		return (
			<Card
				className={cn(
					"p-6 rounded-2xl border bg-card text-card-foreground shadow-sm",
					className,
				)}
			>
				<div className="animate-pulse space-y-4">
					<div className="flex gap-2">
						<div className="h-6 bg-muted rounded-full w-20"></div>
						<div className="h-6 bg-muted rounded-full w-16"></div>
					</div>
					<div className="h-7 bg-muted rounded-lg w-2/3"></div>
					<div className="space-y-2">
						<div className="h-4 bg-muted rounded"></div>
						<div className="h-4 bg-muted rounded"></div>
						<div className="h-4 bg-muted rounded w-5/6"></div>
					</div>
				</div>
			</Card>
		);
	}

	return (
		<LazyMotion features={domAnimation}>
			<AnimatePresence mode="wait" initial={false}>
				<m.div
					key={topic.topicTitle}
					variants={variants}
					initial="hidden"
					animate="visible"
					exit="hidden"
					transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
					className={cn(
						"p-6 rounded-2xl border bg-transparent text-card-foreground shadow-sm",
						"space-y-5",
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
							className="px-3 py-0.5 text-[xs] font-medium bg-primary/10 rounded-full"
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
						className="text-xl font-semibold leading-tight text-foreground text-wrap balance"
					>
						{topic.topicTitle}
					</m.h3>

					<m.div
						variants={variants}
						transition={{ delay: 0.15 }}
						className="space-y-1"
					>
						<p className="text-sm text-muted-foreground leading-relaxed text-pretty">
							{words.map((word, index) => (
								<span
									key={`word-${index}`}
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
								onWordIndexChange={setCurrentWordIndex}
							/>
						</div>
						<PracticeButton onClick={() => router.push("/quiz")} />
						<Button
							size="sm"
							variant="ghost"
							onClick={handleRefresh}
							className={cn(
								"h-8 px-3 text-xs rounded-lg",
								"active:scale-[0.96] transition-transform",
								"transition-colors duration-150 ease-out-quart",
							)}
							aria-label="Get new topic"
						>
							<HugeiconsIcon icon={Dice5} className="h-5 w-5" />
						</Button>
					</m.div>
				</m.div>
			</AnimatePresence>
		</LazyMotion>
	);
}
