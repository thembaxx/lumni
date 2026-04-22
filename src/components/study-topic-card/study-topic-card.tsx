import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/badge";
import {
	TopicData,
	getRandomTopic,
	getDifficultyColor,
} from "./study-topic-card.data";

interface StudyTopicCardProps {
	className?: string;
	initialTopic?: TopicData;
	onLearnMore?: () => void;
	onPractice?: () => void;
}

const variants = {
	hidden: { opacity: 0, y: 8 },
	visible: { opacity: 1, y: 0 },
};

export function StudyTopicCard({
	className,
	initialTopic,
	onLearnMore,
	onPractice,
}: StudyTopicCardProps) {
	const [topic, setTopic] = useState<TopicData | null>(null);
	const [isPlaying, setIsPlaying] = useState(false);
	const [currentWordIndex, setCurrentWordIndex] = useState(-1);
	const [words, setWords] = useState<string[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	const synthRef = useRef<SpeechSynthesis | null>(null);
	const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

	const initializeTopic = useCallback(() => {
		const randomTopic = initialTopic || getRandomTopic();
		setTopic(randomTopic);
		setWords(randomTopic.summary.split(" "));
		setIsLoading(false);
	}, [initialTopic]);

	useEffect(() => {
		initializeTopic();

		if (typeof window !== "undefined") {
			synthRef.current = window.speechSynthesis;
		}
	}, [initializeTopic]);

	const handleListen = () => {
		if (!topic) return;

		if (isPlaying) {
			synthRef.current?.cancel();
			setIsPlaying(false);
			setCurrentWordIndex(-1);
			return;
		}

		synthRef.current?.cancel();

		const utterance = new SpeechSynthesisUtterance(topic.summary);
		utterance.lang = "en-ZA";
		utterance.rate = 0.9;
		utterance.pitch = 1;
		utterance.volume = 1;

		utterance.onboundary = (event) => {
			if (event.name === "word") {
				const wordsSoFar = topic.summary
					.substring(0, event.charIndex)
					.split(" ");
				setCurrentWordIndex(wordsSoFar.length - 1);
			}
		};

		utterance.onend = () => {
			setIsPlaying(false);
			setCurrentWordIndex(-1);
		};

		utterance.onerror = () => {
			setIsPlaying(false);
			setCurrentWordIndex(-1);
		};

		utteranceRef.current = utterance;
		synthRef.current?.speak(utterance);
		setIsPlaying(true);
	};

	const handleRefresh = () => {
		if (isPlaying) {
			synthRef.current?.cancel();
			setIsPlaying(false);
			setCurrentWordIndex(-1);
		}

		setIsLoading(true);

		setTimeout(() => {
			initializeTopic();
		}, 150);
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
		<AnimatePresence mode="wait" initial={false}>
			<motion.div
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
				{/* Header with badges - staggered entrance */}
				<motion.div
					variants={variants}
					transition={{ delay: 0.05 }}
					className="flex justify-between items-start"
				>
					<Badge
						variant="outline"
						className="px-3 py-0.5 text-[xs] font-medium rounded-full"
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
				</motion.div>

				{/* Topic title with text-wrap balance */}
				<motion.h3
					variants={variants}
					transition={{ delay: 0.1 }}
					className="text-xl font-semibold leading-tight text-foreground text-wrap balance"
				>
					{topic.topicTitle}
				</motion.h3>

				{/* Summary with word highlighting */}
				<motion.div
					variants={variants}
					transition={{ delay: 0.15 }}
					className="space-y-1"
				>
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
				</motion.div>
				<div className="flex items-center gap-2">
					<Button
						size="sm"
						variant="outline"
						onClick={handleListen}
						className={cn(
							"h-8 px-3 text-xs rounded-lg",
							"active:scale-[0.96] transition-transform",
							"transition-colors duration-150 ease-out-quart",
						)}
					>
						<span className="mr-1.5">{isPlaying ? "■" : "▶"}</span>
						{isPlaying ? "Stop listening..." : "Listen to this lesson"}
					</Button>
					<Button
						size="sm"
						variant="default"
						onClick={onPractice}
						className={cn(
							"h-8 px-3 text-xs rounded-lg",
							"active:scale-[0.96] transition-transform",
							"transition-colors duration-150 ease-out-quart",
						)}
					>
						Practice
					</Button>
				</div>

				{/* Action buttons with scale on press */}
				<motion.div
					variants={variants}
					transition={{ delay: 0.2 }}
					className="flex gap-2 justify-between items-center pt-1"
				>
					<div className="flex gap-2">
						<Button
							size="sm"
							variant="ghost"
							onClick={handleRefresh}
							className={cn(
								"h-8 px-3 text-xs rounded-lg",
								"active:scale-[0.96] transition-transform",
								"transition-colors duration-150 ease-out-quart",
							)}
						>
							<span className="mr-1.5">↻</span>
							New
						</Button>
					</div>

					<div className="flex gap-2">
						<Button
							size="sm"
							variant="ghost"
							onClick={onLearnMore}
							className={cn(
								"h-8 px-3 text-xs rounded-lg",
								"active:scale-[0.96] transition-transform",
								"transition-colors duration-150 ease-out-quart",
							)}
						>
							Learn More
						</Button>
					</div>
				</motion.div>
			</motion.div>
		</AnimatePresence>
	);
}
