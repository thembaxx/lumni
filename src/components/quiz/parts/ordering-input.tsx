"use client";

import { AnimatePresence, m } from "framer-motion";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useDragSort } from "@/hooks/use-drag-sort";
import type { OrderingItem } from "@/lib/question-engine/types";

interface OrderingInputProps {
	items: OrderingItem[];
	onSubmit: (orderedIds: string[]) => void;
}

export function OrderingInput({ items, onSubmit }: OrderingInputProps) {
	const t = useTranslations();
	const [orderedIds, setOrderedIds] = useState<string[]>(
		useMemo(
			() => [...items].sort(() => Math.random() - 0.5).map((i) => i.id),
			[items],
		),
	);

	const {
		draggedId,
		hoveredId,
		handleDragStart,
		handleDragOver,
		handleDragEnd,
	} = useDragSort();

	const handleDrop = useCallback((e: React.DragEvent, targetId: string) => {
		e.preventDefault();
		const sourceId = e.dataTransfer.getData("text/plain");
		if (!sourceId || sourceId === targetId) return;

		setOrderedIds((prev) => {
			const newOrder = prev.filter((id) => id !== sourceId);
			const targetIdx = newOrder.indexOf(targetId);
			newOrder.splice(
				targetIdx >= 0 ? targetIdx : newOrder.length,
				0,
				sourceId,
			);
			return newOrder;
		});
	}, []);

	const moveUp = useCallback((id: string) => {
		setOrderedIds((prev) => {
			const idx = prev.indexOf(id);
			if (idx <= 0) return prev;
			const next = [...prev];
			[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
			return next;
		});
	}, []);

	const moveDown = useCallback((id: string) => {
		setOrderedIds((prev) => {
			const idx = prev.indexOf(id);
			if (idx < 0 || idx >= prev.length - 1) return prev;
			const next = [...prev];
			[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
			return next;
		});
	}, []);

	const itemMap = useMemo(
		() => Object.fromEntries(items.map((i) => [i.id, i])),
		[items],
	);

	return (
		<div className="flex flex-col gap-3">
			<div className="flex flex-col gap-2">
				<AnimatePresence mode="popLayout">
					{orderedIds.map((id, idx) => {
						const item = itemMap[id];
						const isDragging = draggedId === id;
						const isOver = hoveredId === id && draggedId !== id;
						return (
							<m.div
								key={id}
								layout
								initial={{ opacity: 0, y: -8 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, scale: 0.95 }}
								transition={{ duration: 0.2 }}
								className={`flex min-h-11 items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-[background-color,box-shadow] ${
									isDragging
										? "border-(--system-accent) bg-(--system-accent-alpha-10) opacity-50 shadow-level-1"
										: isOver
											? "border-(--system-accent) bg-(--system-accent-alpha-5)"
											: "border-border bg-card"
								}`}
							>
								<button
									type="button"
									draggable
									aria-grabbed={isDragging}
									onDragStart={(e: React.DragEvent) => handleDragStart(e, id)}
									onDragOver={(e: React.DragEvent) => handleDragOver(e, id)}
									onDragEnd={handleDragEnd}
									onDrop={(e: React.DragEvent) => handleDrop(e, id)}
									className="flex flex-1 cursor-grab items-center gap-3 bg-transparent text-left active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-(--system-accent) rounded-lg"
								>
									<div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted font-medium text-muted-foreground text-xs tabular-nums">
										{idx + 1}
									</div>
									<p className="flex-1">{item?.text ?? id}</p>
								</button>
								<div className="flex shrink-0 gap-1">
									<button
										type="button"
										onClick={() => moveUp(id)}
										disabled={idx === 0}
										className="flex min-h-9 min-w-9 items-center justify-center rounded-md text-muted-foreground text-xs hover:bg-muted active:scale-95 disabled:opacity-20 focus-visible:ring-2 focus-visible:ring-(--system-accent)"
										aria-label="Move up"
									>
										↑
									</button>
									<button
										type="button"
										onClick={() => moveDown(id)}
										disabled={idx === orderedIds.length - 1}
										className="flex min-h-9 min-w-9 items-center justify-center rounded-md text-muted-foreground text-xs hover:bg-muted active:scale-95 disabled:opacity-20 focus-visible:ring-2 focus-visible:ring-(--system-accent)"
										aria-label="Move down"
									>
										↓
									</button>
								</div>
							</m.div>
						);
					})}
				</AnimatePresence>
			</div>
			<Button onClick={() => onSubmit(orderedIds)} className="self-start">
				{t("quiz.submitAnswer")}
			</Button>
		</div>
	);
}
