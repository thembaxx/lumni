"use client";

import { useCallback, useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
import { Stage, Layer, Line, Rect, Circle, Text as KonvaText } from "react-konva";

export interface SharedWhiteboardHandle {
  clear: () => void;
  snapshot: () => string;
}

interface SharedWhiteboardProps {
  className?: string;
  readOnly?: boolean;
}

type Tool = "pen" | "rect" | "circle" | "line" | "text";
type ColorOption = string;

interface DrawingStroke {
  id: string;
  type: "stroke" | "rect" | "circle" | "line" | "text";
  points: number[];
  color: string;
  strokeWidth: number;
  text?: string;
}

const COLORS: ColorOption[] = ["#1a1a2e", "#e94560", "#0f3460", "#16a34a", "#f59e0b"];

function generateId(): string {
  return `draw_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export const SharedWhiteboard = forwardRef<SharedWhiteboardHandle, SharedWhiteboardProps>(
  function SharedWhiteboard({ className = "", readOnly = false }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const stageRef = useRef<any>(null);
    const [dimensions, setDimensions] = useState({ width: 600, height: 400 });
    const [tool, setTool] = useState<Tool>("pen");
    const [color, setColor] = useState<string>(COLORS[0]);
    const [strokes, setStrokes] = useState<DrawingStroke[]>([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentPoints, setCurrentPoints] = useState<number[]>([]);
    const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);

    const strokeWidth = tool === "pen" ? 2 : 3;

    useImperativeHandle(ref, () => ({
      clear: () => setStrokes([]),
      snapshot: () => JSON.stringify(strokes),
    }));

    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          setDimensions({ width: Math.floor(width), height: Math.max(300, Math.floor(height)) });
        }
      });

      observer.observe(container);
      return () => observer.disconnect();
    }, []);

    const getPointerPos = useCallback(() => {
      const stage = stageRef.current;
      if (!stage) return null;
      const pos = stage.getPointerPosition();
      return pos ? { x: pos.x, y: pos.y } : null;
    }, []);

    const handleMouseDown = useCallback(() => {
      if (readOnly) return;
      const pos = getPointerPos();
      if (!pos) return;
      setIsDrawing(true);
      setStartPos(pos);
      if (tool === "pen") {
        setCurrentPoints([pos.x, pos.y]);
      }
    }, [readOnly, getPointerPos, tool]);

    const handleMouseMove = useCallback(() => {
      if (!isDrawing || readOnly) return;
      const pos = getPointerPos();
      if (!pos) return;

      if (tool === "pen") {
        setCurrentPoints((prev) => [...prev, pos.x, pos.y]);
      }
    }, [isDrawing, readOnly, tool, getPointerPos]);

    const handleMouseUp = useCallback(() => {
      if (!isDrawing || readOnly) return;
      setIsDrawing(false);

      const pos = getPointerPos();
      if (!pos || !startPos) {
        setCurrentPoints([]);
        setStartPos(null);
        return;
      }

      let newStroke: DrawingStroke | null = null;

      switch (tool) {
        case "pen":
          if (currentPoints.length >= 4) {
            newStroke = {
              id: generateId(),
              type: "stroke",
              points: currentPoints,
              color,
              strokeWidth,
            };
          }
          break;
        case "rect":
          newStroke = {
            id: generateId(),
            type: "rect",
            points: [startPos.x, startPos.y, pos.x - startPos.x, pos.y - startPos.y],
            color,
            strokeWidth,
          };
          break;
        case "circle": {
          const cx = (startPos.x + pos.x) / 2;
          const cy = (startPos.y + pos.y) / 2;
          const rx = Math.abs(pos.x - startPos.x) / 2;
          const ry = Math.abs(pos.y - startPos.y) / 2;
          newStroke = {
            id: generateId(),
            type: "circle",
            points: [cx, cy, rx, ry],
            color,
            strokeWidth,
          };
          break;
        }
        case "line":
          newStroke = {
            id: generateId(),
            type: "line",
            points: [startPos.x, startPos.y, pos.x, pos.y],
            color,
            strokeWidth,
          };
          break;
        case "text":
          newStroke = {
            id: generateId(),
            type: "text",
            points: [pos.x, pos.y],
            color,
            strokeWidth: 14,
            text: "Text",
          };
          break;
      }

      if (newStroke) {
        setStrokes((prev) => [...prev, newStroke]);
      }

      setCurrentPoints([]);
      setStartPos(null);
    }, [isDrawing, readOnly, tool, getPointerPos, startPos, currentPoints, color, strokeWidth]);

    const handleUndo = useCallback(() => {
      setStrokes((prev) => prev.slice(0, -1));
    }, []);

    const handleClear = useCallback(() => {
      setStrokes([]);
    }, []);

    const renderStroke = (s: DrawingStroke) => {
      switch (s.type) {
        case "stroke":
          return (
            <Line
              key={s.id}
              points={s.points}
              stroke={s.color}
              strokeWidth={s.strokeWidth}
              lineCap="round"
              lineJoin="round"
              tension={0.3}
            />
          );
        case "rect":
          return (
            <Rect
              key={s.id}
              x={s.points[0]}
              y={s.points[1]}
              width={s.points[2]}
              height={s.points[3]}
              stroke={s.color}
              strokeWidth={s.strokeWidth}
            />
          );
        case "circle":
          return (
            <Circle
              key={s.id}
              x={s.points[0]}
              y={s.points[1]}
              radiusX={Math.abs(s.points[2])}
              radiusY={Math.abs(s.points[3])}
              stroke={s.color}
              strokeWidth={s.strokeWidth}
            />
          );
        case "line":
          return (
            <Line
              key={s.id}
              points={s.points}
              stroke={s.color}
              strokeWidth={s.strokeWidth}
              lineCap="round"
            />
          );
        case "text":
          return (
            <KonvaText
              key={s.id}
              x={s.points[0]}
              y={s.points[1]}
              text={s.text ?? ""}
              fontSize={14}
              fill={s.color}
            />
          );
        default:
          return null;
      }
    };

    const toolButton = (id: Tool, label: string, shortcut: string) => (
      <button
        key={id}
        type="button"
        onClick={() => setTool(id)}
        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
          tool === id
            ? "bg-(--system-accent) text-(--system-accent-foreground)"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        }`}
        aria-label={label}
        aria-pressed={tool === id}
        disabled={readOnly}
      >
        {shortcut}
      </button>
    );

    return (
      <div ref={containerRef} className={`relative flex flex-col ${className}`}>
        <div className="flex items-center gap-1.5 p-2 border-b bg-background/80 backdrop-blur-sm">
          {toolButton("pen", "Pen", "✏️")}
          {toolButton("rect", "Rectangle", "▭")}
          {toolButton("circle", "Circle", "○")}
          {toolButton("line", "Line", "╱")}
          {toolButton("text", "Text", "T")}

          <div className="w-px h-5 mx-1 bg-border" />

          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`size-5 rounded-full border-2 transition-transform ${
                color === c ? "scale-125 border-foreground" : "border-transparent"
              }`}
              style={{ backgroundColor: c }}
              aria-label={`Color ${c}`}
              aria-pressed={color === c}
              disabled={readOnly}
            />
          ))}

          <div className="w-px h-5 mx-1 bg-border" />

          <button
            type="button"
            onClick={handleUndo}
            disabled={strokes.length === 0 || readOnly}
            className="px-2 py-1 rounded text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40"
            aria-label="Undo"
          >
            ↶
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={strokes.length === 0 || readOnly}
            className="px-2 py-1 rounded text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40"
            aria-label="Clear all"
          >
            ✕
          </button>
        </div>

        <div
          className="flex-1"
          style={{ minHeight: 300, cursor: readOnly ? "default" : "crosshair" }}
        >
          <Stage
            ref={stageRef}
            width={dimensions.width}
            height={Math.max(300, dimensions.height)}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={(e) => {
              if (readOnly) return;
              e.evt.preventDefault();
              const pos = stageRef.current?.getPointerPosition();
              if (!pos) return;
              setIsDrawing(true);
              setStartPos({ x: pos.x, y: pos.y });
              if (tool === "pen") setCurrentPoints([pos.x, pos.y]);
            }}
            onTouchMove={(e) => {
              if (!isDrawing || readOnly) return;
              e.evt.preventDefault();
              const pos = stageRef.current?.getPointerPosition();
              if (!pos) return;
              if (tool === "pen") setCurrentPoints((prev) => [...prev, pos.x, pos.y]);
            }}
            onTouchEnd={(e) => {
              if (!isDrawing || readOnly) return;
              e.evt.preventDefault();
              handleMouseUp();
            }}
            ariaLabel="Shared whiteboard canvas"
          >
            <Layer>
              {strokes.map(renderStroke)}
              {tool === "pen" && currentPoints.length >= 4 && (
                <Line
                  points={currentPoints}
                  stroke={color}
                  strokeWidth={strokeWidth}
                  lineCap="round"
                  lineJoin="round"
                  tension={0.3}
                />
              )}
              {isDrawing && startPos && getPointerPos() && tool === "line" && (
                <Line
                  points={[startPos.x, startPos.y, getPointerPos()!.x, getPointerPos()!.y]}
                  stroke={color}
                  strokeWidth={strokeWidth}
                  dash={[4, 4]}
                  lineCap="round"
                />
              )}
              {isDrawing && startPos && getPointerPos() && tool === "rect" && (
                <Rect
                  x={startPos.x}
                  y={startPos.y}
                  width={getPointerPos()!.x - startPos.x}
                  height={getPointerPos()!.y - startPos.y}
                  stroke={color}
                  strokeWidth={strokeWidth}
                  dash={[4, 4]}
                />
              )}
              {isDrawing && startPos && getPointerPos() && tool === "circle" && (
                <Circle
                  x={(startPos.x + getPointerPos()!.x) / 2}
                  y={(startPos.y + getPointerPos()!.y) / 2}
                  radiusX={Math.abs(getPointerPos()!.x - startPos.x) / 2}
                  radiusY={Math.abs(getPointerPos()!.y - startPos.y) / 2}
                  stroke={color}
                  strokeWidth={strokeWidth}
                  dash={[4, 4]}
                />
              )}
            </Layer>
          </Stage>
        </div>
      </div>
    );
  },
);
