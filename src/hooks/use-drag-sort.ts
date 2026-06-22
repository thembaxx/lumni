import { useCallback, useState } from "react";

export function useDragSort() {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [touchSelected, setTouchSelected] = useState<string | null>(null);

  const isTouchDevice =
    typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0);

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

  const handleTouchSelect = useCallback(
    (id: string) => {
      if (touchSelected === id) {
        setTouchSelected(null);
      } else {
        setTouchSelected(id);
      }
    },
    [touchSelected],
  );

  const handleTouchPlace = useCallback(
    (_targetId: string) => {
      const sourceId = touchSelected;
      setTouchSelected(null);
      return sourceId;
    },
    [touchSelected],
  );

  const handleTouchCancel = useCallback(() => {
    setTouchSelected(null);
  }, []);

  return {
    draggedId,
    hoveredId,
    touchSelected,
    isTouchDevice,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleTouchSelect,
    handleTouchPlace,
    handleTouchCancel,
  };
}
