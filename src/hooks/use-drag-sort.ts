import { useCallback, useState } from "react";

export interface DragSortState {
	draggedId: string | null;
	hoveredId: string | null;
}

export function useDragSort() {
	const [draggedId, setDraggedId] = useState<string | null>(null);
	const [hoveredId, setHoveredId] = useState<string | null>(null);

	const handleDragStart = useCallback((e: React.DragEvent, id: string) => {
		setDraggedId(id);
		e.dataTransfer.effectAllowed = "move";
		e.dataTransfer.setData("text/plain", id);
	}, []);

	const handleDragOver = useCallback((e: React.DragEvent, id: string) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = "move";
		setHoveredId(id);
	}, []);

	const handleDragEnd = useCallback(() => {
		setDraggedId(null);
		setHoveredId(null);
	}, []);

	const handleDrop = useCallback(
		(
			e: React.DragEvent,
			callback: (sourceId: string, targetId: string) => void,
		) => {
			e.preventDefault();
			const sourceId = e.dataTransfer.getData("text/plain");
			if (sourceId) {
				const targetId = hoveredId;
				callback(sourceId, targetId ?? "");
			}
			setDraggedId(null);
			setHoveredId(null);
		},
		[hoveredId],
	);

	const handleDropOnTarget = useCallback(
		(
			e: React.DragEvent,
			targetId: string,
			isUsed?: (id: string) => boolean,
		) => {
			e.preventDefault();
			const sourceId = e.dataTransfer.getData("text/plain");
			if (!sourceId || (isUsed?.(targetId) ?? false)) {
				setDraggedId(null);
				setHoveredId(null);
				return;
			}
			return sourceId;
		},
		[],
	);

	return {
		draggedId,
		hoveredId,
		handleDragStart,
		handleDragOver,
		handleDragEnd,
		handleDrop,
		handleDropOnTarget,
	};
}
