"use client";

import { AnimatePresence, m } from "framer-motion";
import { useRouter } from "@/i18n/navigation";
import { useMemo, useState } from "react";
import { ListenToLesson } from "@/components/listen-to-lesson";
import { Anim } from "@/components/shared/anim";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { PracticeButton } from "@/components/study/practice-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/shared";
import type { Difficulty } from "@/lib/utils/colors";

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
	const wordEntries = useMemo(() => {
		return text.split(" ").map((word, idx) => ({
			word,
			pos: idx,
			key: `w-${idx}`,
		}));
	}, [text]);

	return (
		<p className="text-pretty text-muted-foreground text-sm leading-relaxed">
			{wordEntries.map((entry) => (
				<span
					key={entry.key}
					className={cn(
						"transition-colors duration-150 ease-[var(--ease-ios)]",
						entry.pos === currentWordIndex &&
							"-mx-0.5 rounded bg-[--system-accent]/10 px-0.5 font-medium text-foreground",
					)}
				>
					{entry.word}
					{entry.pos < wordEntries.length - 1 && " "}
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
		<AnimatePresence initial={false}>
			{isOpen && (
				<m.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					className="fixed inset-0 z-modal bg-black/40 backdrop-blur-sm"
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
	onPracticeClick: _onPracticeClick,
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
	const { push } = useRouter();

	return (
		<m.div
			key={`${data.id}-open`}
			layoutId={`card-${data.id}`}
			className="fixed top-1/2 left-1/2 z-modal w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2"
		>
			<div className="max-h-[80dvh] overflow-hidden overflow-y-auto rounded-2xl rounded-card-lg border border-border/80 bg-card bg-card p-4 text-card-foreground shadow-2xl shadow-black/20 transition-colors">
				<div className="flex flex-col gap-3">
					<div className="flex items-start justify-between">
						<Badge
							variant="outline"
							className="rounded-full bg-[--system-accent]/10 px-3 py-0.5 font-medium text-xs"
						>
							{data.subject}
						</Badge>
						<DifficultyBadge difficulty={data.difficulty} />
					</div>

					<div className="flex flex-col gap-1">
						<h3 className="balance text-wrap font-semibold text-foreground text-xl leading-tight">
							{data.title}
						</h3>
						<HighlightedText text={data.summary} currentWordIndex={-1} />
					</div>

					<div className="flex items-center gap-2 pt-2">
						{isPlaying ? (
							<Skeleton className="inline-flex rounded-full">
								<ListenToLesson
									text={data.summary}
									onPlayingChange={onPlayingChange}
									onWordIndexChange={onWordIndexChange}
								/>
							</Skeleton>
						) : (
							<ListenToLesson
								text={data.summary}
								onPlayingChange={onPlayingChange}
								onWordIndexChange={onWordIndexChange}
							/>
						)}
						<PracticeButton
							onClick={() =>
								push(
									quizUrl ||
										`/quiz?subject=${encodeURIComponent(data.subject)}&topic=${encodeURIComponent(data.title)}`,
								)
							}
						/>
					</div>

					<Button variant="outline" className="mt-6 w-full" onClick={onClose}>
						Close
					</Button>
				</div>
			</div>
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
	const { push } = useRouter();

	return (
		<m.div key={`${data.id}-closed`} layoutId={`card-${data.id}`}>
			<div className="w-full rounded-2xl border bg-card p-5 text-left text-card-foreground shadow-sm">
				<button
					type="button"
					onClick={onOpen}
					className="flex w-full flex-col gap-3 text-left transition-[scale,colors] duration-200 hover:border-[--system-accent]/20 active:scale-[0.96]"
					aria-label={`${data.title} - ${data.difficulty} topic`}
				>
					<div className="flex items-start justify-between">
						<Badge
							variant="outline"
							className="rounded-full bg-[--system-accent]/10 px-3 py-0.5 font-medium text-xs"
						>
							{data.subject}
						</Badge>
						<DifficultyBadge difficulty={data.difficulty} />
					</div>

					<div className="flex flex-col gap-1">
						<h3 className="balance text-wrap font-semibold text-foreground text-md leading-tight">
							{data.title}
						</h3>
						<HighlightedText
							text={data.summary}
							currentWordIndex={currentWordIndex}
						/>
					</div>
				</button>

				<div className="mt-3 flex items-center gap-2">
					{isPlaying ? (
						<Skeleton className="inline-flex rounded-full">
							<ListenToLesson
								text={data.summary}
								onPlayingChange={onPlayingChange}
								onWordIndexChange={onWordIndexChange}
							/>
						</Skeleton>
					) : (
						<ListenToLesson
							text={data.summary}
							onPlayingChange={onPlayingChange}
							onWordIndexChange={onWordIndexChange}
						/>
					)}
					<PracticeButton
						onClick={() =>
							push(
								`/quiz?subject=${encodeURIComponent(data.subject)}&topic=${encodeURIComponent(data.title)}`,
							)
						}
					/>
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
		<Anim>
			<CardOverlay isOpen={isOpen} onClose={() => onOpenChange(false)} />

			<AnimatePresence mode="popLayout" initial={false}>
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
		</Anim>
	);
}
