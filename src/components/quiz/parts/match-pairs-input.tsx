"use client";

import { AnimatePresence, m } from "framer-motion";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

interface MatchPairsInputProps {
	leftItems: { id: string; text: string }[];
	rightItems: { id: string; text: string }[];
	onSubmit: (matches: Record<string, string>) => void;
}

export function MatchPairsInput({
	leftItems,
	rightItems,
	onSubmit,
}: MatchPairsInputProps) {
	const t = useTranslations();
	const [matches, setMatches] = useState<Record<string, string>>({});
	const [draggedLeftId, setDraggedLeftId] = useState<string | null>(null);
	const [hoveredRightId, setHoveredRightId] = useState<string | null>(null);

	const shuffledRight = useMemo(
		() => [...rightItems].sort(() => Math.random() - 0.5),
		[rightItems],
	);

	const getMatchedRight = useCallback(
		(leftId: string) => {
			const rightId = matches[leftId];
			if (!rightId) return null;
			return rightItems.find((r) => r.id === rightId) ?? null;
		},
		[matches, rightItems],
	);

	const isRightUsed = useCallback(
		(rightId: string) => Object.values(matches).includes(rightId),
		[matches],
	);

	const handleLeftDragStart = useCallback(
		(e: React.DragEvent, leftId: string) => {
			setDraggedLeftId(leftId);
			e.dataTransfer.effectAllowed = "move";
			e.dataTransfer.setData("text/plain", leftId);
		},
		[],
	);

	const handleRightDragOver = useCallback(
		(e: React.DragEvent, rightId: string) => {
			e.preventDefault();
			e.dataTransfer.dropEffect = "move";
			setHoveredRightId(rightId);
		},
		[],
	);

	const handleDropOnRight = useCallback(
		(e: React.DragEvent, rightId: string) => {
			e.preventDefault();
			const leftId = e.dataTransfer.getData("text/plain");
			if (!leftId || isRightUsed(rightId)) {
				setDraggedLeftId(null);
				setHoveredRightId(null);
				return;
			}
			setMatches((prev) => ({ ...prev, [leftId]: rightId }));
			setDraggedLeftId(null);
			setHoveredRightId(null);
		},
		[isRightUsed],
	);

	const handleDragEnd = useCallback(() => {
		setDraggedLeftId(null);
		setHoveredRightId(null);
	}, []);

	const removeMatch = useCallback((leftId: string) => {
		setMatches((prev) => {
			const next = { ...prev };
			delete next[leftId];
			return next;
		});
	}, []);

	return (
		<div className="flex flex-col gap-6">
			<div className="flex gap-8 max-sm:flex-col">
				<div className="flex flex-1 flex-col gap-2">
					<p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
						Items
					</p>
					<AnimatePresence mode="popLayout">
						{leftItems.map((item) => {
							const matched = getMatchedRight(item.id);
							if (matched) {
								return (
									<m.div
										key={item.id}
										layout
										initial={{ opacity: 0, y: -4 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, scale: 0.95 }}
										className="flex items-center gap-2 rounded-xl border border-(--system-accent) bg-(--system-accent-alpha-10) px-3 py-2.5 text-sm"
									>
										<span className="flex-1">{item.text}</span>
										<span className="text-muted-foreground">→</span>
										<span className="font-medium">{matched.text}</span>
										<button
											type="button"
											onClick={() => removeMatch(item.id)}
											className="ml-1 flex h-5 w-5 items-center justify-center rounded-md text-muted-foreground text-xs hover:bg-muted active:scale-95"
											aria-label={`Remove match for ${item.text}`}
										>
											✕
										</button>
									</m.div>
								);
							}
							return (
								<m.div
									key={item.id}
									layout
									initial={{ opacity: 0, y: -4 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, scale: 0.95 }}
									className="rounded-xl border border-border bg-card px-3 py-2.5 text-sm"
								>
									<button
										type="button"
										draggable
										aria-grabbed={draggedLeftId === item.id}
										onDragStart={(e: React.DragEvent) =>
											handleLeftDragStart(e, item.id)
										}
										onDragEnd={handleDragEnd}
										className="w-full cursor-grab bg-transparent text-left active:cursor-grabbing"
									>
										{item.text}
									</button>
								</m.div>
							);
						})}
					</AnimatePresence>
				</div>

				<div className="flex flex-1 flex-col gap-2">
					<p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
						Drop targets
					</p>
					{shuffledRight.map((item) => {
						const used = isRightUsed(item.id);
						const isHovered = hoveredRightId === item.id && !used;
						return (
							<button
								type="button"
								key={item.id}
								aria-label={`Drop target for ${item.text}`}
								onDragOver={(e: React.DragEvent) =>
									handleRightDragOver(e, item.id)
								}
								onDragLeave={handleDragEnd}
								onDrop={(e: React.DragEvent) => handleDropOnRight(e, item.id)}
								className={`w-full rounded-xl border-2 px-3 py-2.5 text-left text-sm transition-all ${
									used
										? "border-muted bg-muted/50 text-muted-foreground line-through"
										: isHovered
											? "scale-[1.02] border-(--system-accent) bg-(--system-accent-alpha-5)"
											: "border-muted-foreground/30 border-dashed bg-transparent"
								}`}
							>
								{item.text}
							</button>
						);
					})}
				</div>
			</div>

			<Button
				onClick={() => onSubmit(matches)}
				disabled={Object.keys(matches).length < leftItems.length}
			>
				{t("quiz.submitAnswer")}
			</Button>
		</div>
	);
}
