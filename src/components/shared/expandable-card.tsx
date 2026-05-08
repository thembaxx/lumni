"use client";

import { AnimatePresence, domAnimation, LazyMotion, m } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ListenToLesson } from "@/components/listen-to-lesson";
import { PracticeButton } from "@/components/study/practice-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Difficulty } from "@/lib/utils/colors";

export interface ExpandableCardData {
	id: string;
	subject: string;
	difficulty: Difficulty;
	title: string;
	summary: string;
}

export interface ExpandableCardProps {
	data: ExpandableCardData;
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	onPracticeClick?: () => void;
	quizUrl?: string;
}

function HighlightedText({
	text,
	currentWordIndex,
}: {
	text: string;
	currentWordIndex: number;
}) {
	const [words, setWords] = useState<string[]>([]);

	useEffect(() => {
		setWords(text.split(" "));
	}, [text]);

	return (
		<p className="text-sm text-muted-foreground leading-relaxed text-pretty">
			{words.map((word, index) => (
				<span
					key={`${currentWordIndex}-${index}`}
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
	);
}

function CardOverlay({
	isOpen,
	onClose,
}: {
	isOpen: boolean;
	onClose: () => void;
}) {
	return (
		<AnimatePresence>
			{isOpen && (
				<m.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
					onClick={onClose}
					role="presentation"
				/>
			)}
		</AnimatePresence>
	);
}

function ExpandedContent({
	data,
	isPlaying,
	onPlayingChange,
	onWordIndexChange,
	onClose,
	onPracticeClick,
	quizUrl,
}: {
	data: ExpandableCardData;
	isPlaying: boolean;
	onPlayingChange: (playing: boolean) => void;
	onWordIndexChange: (index: number) => void;
	onClose: () => void;
	onPracticeClick?: () => void;
	quizUrl?: string;
}) {
	const router = useRouter();

	return (
		<m.div
			key={`${data.id}-open`}
			layoutId={`card-${data.id}`}
			className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2"
		>
			<Card className="p-4 rounded-2xl border bg-card text-card-foreground shadow-2xl shadow-black/20 max-h-[80dvh] overflow-y-auto">
				<div className="space-y-3">
					<div className="flex justify-between items-start">
						<Badge
							variant="outline"
							className="px-3 py-0.5 text-xs font-medium bg-primary/10 rounded-full"
						>
							{data.subject}
						</Badge>
						<Badge
							className={cn(
								"px-3 py-0.5 text-[10px] uppercase font-medium bg-primary/10 rounded-full",
								data.difficulty === "easy" &&
									"bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
								data.difficulty === "medium" &&
									"bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
								data.difficulty === "hard" &&
									"bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
							)}
						>
							{data.difficulty}
						</Badge>
					</div>

					<div className="space-y-1">
						<h3 className="text-xl font-semibold leading-tight text-foreground text-wrap balance">
							{data.title}
						</h3>
						<HighlightedText text={data.summary} currentWordIndex={-1} />
					</div>

					<div className="flex gap-2 items-center pt-2">
						<div className={isPlaying ? "animate-pulse" : ""}>
							<ListenToLesson
								text={data.summary}
								onPlayingChange={onPlayingChange}
								onWordIndexChange={onWordIndexChange}
							/>
						</div>
						<PracticeButton
							onClick={() =>
								router.push(
									quizUrl ||
										`/quiz?subject=${encodeURIComponent(data.subject)}&topic=${encodeURIComponent(data.title)}`,
								)
							}
						/>
					</div>

					<Button variant="outline" className="w-full mt-6" onClick={onClose}>
						Close
					</Button>
				</div>
			</Card>
		</m.div>
	);
}

function CollapsedContent({
	data,
	isPlaying,
	onPlayingChange,
	onWordIndexChange,
	onOpen,
	currentWordIndex,
}: {
	data: ExpandableCardData;
	isPlaying: boolean;
	onPlayingChange: (playing: boolean) => void;
	onWordIndexChange: (index: number) => void;
	onOpen: () => void;
	currentWordIndex: number;
}) {
	const router = useRouter();

	return (
		<m.div key={`${data.id}-closed`} layoutId={`card-${data.id}`}>
			<div
				onClick={onOpen}
				className="p-5 rounded-2xl border bg-card text-card-foreground shadow-sm hover:border-primary/20 transition-colors transition-transform duration-200 cursor-pointer w-full text-left"
				role="button"
				tabIndex={0}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault();
						onOpen();
					}
				}}
				aria-label={`${data.title} - ${data.difficulty} topic`}
			>
				<div className="space-y-3">
					<div className="flex justify-between items-start">
						<Badge
							variant="outline"
							className="px-3 py-0.5 text-xs font-medium bg-primary/10 rounded-full"
						>
							{data.subject}
						</Badge>
						<Badge
							className={cn(
								"px-3 py-0.5 text-[10px] uppercase font-medium bg-primary/10 rounded-full",
								data.difficulty === "easy" &&
									"bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
								data.difficulty === "medium" &&
									"bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
								data.difficulty === "hard" &&
									"bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
							)}
						>
							{data.difficulty}
						</Badge>
					</div>

					<div className="space-y-1">
						<h3 className="text-md font-semibold leading-tight text-foreground text-wrap balance">
							{data.title}
						</h3>
						<HighlightedText
							text={data.summary}
							currentWordIndex={currentWordIndex}
						/>
					</div>

					<div className="flex gap-2 items-center">
						<div className={isPlaying ? "animate-pulse" : ""}>
							<ListenToLesson
								text={data.summary}
								onPlayingChange={onPlayingChange}
								onWordIndexChange={onWordIndexChange}
							/>
						</div>
						<PracticeButton
							onClick={() =>
								router.push(
									`/quiz?subject=${encodeURIComponent(data.subject)}&topic=${encodeURIComponent(data.title)}`,
								)
							}
						/>
					</div>
				</div>
			</div>
		</m.div>
	);
}

export function ExpandableCard({
	data,
	isOpen,
	onOpenChange,
	quizUrl,
}: ExpandableCardProps) {
	const [isPlaying, setIsPlaying] = useState(false);
	const [currentWordIndex, setCurrentWordIndex] = useState(-1);

	return (
		<LazyMotion features={domAnimation}>
			<CardOverlay isOpen={isOpen} onClose={() => onOpenChange(false)} />

			<AnimatePresence mode="popLayout">
				{isOpen ? (
					<ExpandedContent
						data={data}
						isPlaying={isPlaying}
						onPlayingChange={setIsPlaying}
						onWordIndexChange={setCurrentWordIndex}
						onClose={() => onOpenChange(false)}
						quizUrl={quizUrl}
					/>
				) : (
					<CollapsedContent
						data={data}
						isPlaying={isPlaying}
						onPlayingChange={setIsPlaying}
						onWordIndexChange={setCurrentWordIndex}
						onOpen={() => onOpenChange(true)}
						currentWordIndex={currentWordIndex}
					/>
				)}
			</AnimatePresence>
		</LazyMotion>
	);
}
