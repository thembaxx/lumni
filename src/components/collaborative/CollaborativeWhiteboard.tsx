"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Stage, Layer, Line, Circle, Rect, Text, Image as KonvaImage } from "react-konva";
import * as Y from "yjs";
import { WebrtcProvider } from "y-webrtc";
import { useAblyChat } from "@/hooks/use-ably-chat";
import { useCollaborativeSession } from "@/hooks/use-collaborative-sessions";
import { useAuth } from "@/lib/auth/auth-context";

interface WhiteboardProps {
  sessionId: string;
  userId: string;
  userName: string;
  userColor: string;
  onStroke?: (points: number[], color: string, width: number) => void;
  className?: string;
}

const TOOL_COLORS = {
  pen: "#1a1a2e",
  eraser: "#ffffff",
  highlighter: "#fef08a",
  shape: "#1a1a2e",
};

const TOOL_WIDTHS = {
  pen: 2,
  eraser: 20,
  highlighter: 10,
  shape: 2,
};

export function CollaborativeWhiteboard({
  sessionId,
  userId,
  userName,
  userColor,
  className = "",
}: WhiteboardProps) {
  const { user } = useAuth();
  const { data: sessionData } = useCollaborativeSession(sessionId);
  const ablyChat = useAblyChat();

  const stageRef = useRef<Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tool, setTool] = useState<"pen" | "eraser" | "highlighter" | "select" | "text" | "shape">("pen");
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<number[]>([]);
  const [objects, setObjects] = useState<Map<string, any>>(new Map());
  const [awareness, setAwareness] = useState<Map<number, any>>(new Map());

  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebrtcProvider | null>(null);
  const objectsMapRef = useRef<Y.Map<any> | null>(null);
  const awarenessRef = useRef<any>(null);

  // Initialize Yjs and WebRTC provider
  useEffect(() => {
    if (!sessionId || !userId) return;

    const doc = new Y.Doc();
    ydocRef.current = doc;
    const objectsMap = doc.getMap("whiteboard-objects");
    objectsMapRef.current = objectsMap;

    const provider = new WebrtcProvider(`whiteboard-${sessionId}`, doc, {
      signaling: ["wss://signaling.yjs.dev"],
    });
    providerRef.current = provider;

    const awareness = provider.awareness;
    awarenessRef.current = awareness;

    awareness.setLocalStateField("user", {
      id: userId,
      name: userName,
      color: userColor,
      cursor: { x: 0, y: 0 },
      currentTool: tool,
    });

    awareness.on("change", () => {
      const states = new Map<number, any>();
      awareness.getStates().forEach((state: any, clientId: number) => {
        if (clientId !== awareness.clientID && state.user) {
          states.set(clientId, state.user);
        }
      });
      setAwareness(states);
    });

    provider.on("status", (event: { connected: boolean }) => {
      console.log("Whiteboard connection:", event.connected ? "connected" : "disconnected");
    });

    objectsMap.observe(() => {
      const newObjects = new Map<string, any>();
      objectsMap.forEach((value, key) => {
        newObjects.set(key, value);
      });
      setObjects(newObjects);
    });

    return () => {
      provider.destroy();
      doc.destroy();
    };
  }, [sessionId, userId, userName, userColor, tool]);

  // Handle drawing
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (tool === "select" || tool === "text") return;

    const stage = stageRef.current;
    if (!stage) return;

    const pos = stage.getPointerPosition();
    if (!pos) return;

    setIsDrawing(true);
    setCurrentStroke([pos.x, pos.y]);
  }, [tool]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || tool === "select" || tool === "text") return;

    const stage = stageRef.current;
    if (!stage) return;

    const pos = stage.getPointerPosition();
    if (!pos) return;

    setCurrentStroke((prev) => [...prev, pos.x, pos.y]);

    // Update cursor awareness
    if (awarenessRef.current) {
      awarenessRef.current.setLocalStateField("user", {
        id: userId,
        name: userName,
        color: userColor,
        cursor: { x: pos.x, y: pos.y },
        currentTool: tool,
      });
    }
  }, [isDrawing, tool, userId, userName, userColor]);

  const handleMouseUp = useCallback(() => {
    if (!isDrawing || !currentStroke.length) return;

    if (tool === "pen" || tool === "eraser" || tool === "highlighter") {
      const stroke = {
        type: "stroke",
        points: currentStroke,
        color: tool === "eraser" ? TOOL_COLORS.eraser : TOOL_COLORS[tool],
        width: TOOL_WIDTHS[tool],
        userId,
        timestamp: Date.now(),
      };
      objectsMapRef.current?.set(`stroke_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, stroke);
    } else if (tool === "shape" && currentStroke.length >= 4) {
      // Draw rectangle
      const [x1, y1, x2, y2] = currentStroke;
      const shape = {
        type: "shape",
        shapeType: "rectangle",
        x: Math.min(x1, x2),
        y: Math.min(y1, y2),
        width: Math.abs(x2 - x1),
        height: Math.abs(y2 - y1),
        color: TOOL_COLORS.shape,
        width: TOOL_WIDTHS.shape,
        userId,
        timestamp: Date.now(),
      };
      objectsMapRef.current?.set(`shape_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, shape);
    }

    setIsDrawing(false);
    setCurrentStroke([]);
  }, [isDrawing, currentStroke, tool, userId]);

  // Handle touch for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (tool === "select" || tool === "text") return;
    e.preventDefault();

    const stage = stageRef.current;
    if (!stage) return;

    const touch = e.touches[0];
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const pos = {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    };

    setIsDrawing(true);
    setCurrentStroke([pos.x, pos.y]);
  }, [tool]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDrawing || tool === "select" || tool === "text") return;
    e.preventDefault();

    const stage = stageRef.current;
    if (!stage) return;

    const touch = e.touches[0];
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const pos = {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    };

    setCurrentStroke((prev) => [...prev, pos.x, pos.y]);

    if (awarenessRef.current) {
      awarenessRef.current.setLocalStateField("user", {
        id: userId,
        name: userName,
        color: userColor,
        cursor: { x: pos.x, y: pos.y },
        currentTool: tool,
      });
    }
  }, [isDrawing, tool, userId, userName, userColor]);

  const handleTouchEnd = useCallback(() => {
    if (!isDrawing || !currentStroke.length) return;

    if (tool === "pen" || tool === "eraser" || tool === "highlighter") {
      const stroke = {
        type: "stroke",
        points: currentStroke,
        color: tool === "eraser" ? TOOL_COLORS.eraser : TOOL_COLORS[tool],
        width: TOOL_WIDTHS[tool],
        userId,
        timestamp: Date.now(),
      };
      objectsMapRef.current?.set(`stroke_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, stroke);
    }

    setIsDrawing(false);
    setCurrentStroke([]);
  }, [isDrawing, currentStroke, tool, userId]);

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      style={{ width: "100%", height: "100%", minHeight: "500px", backgroundColor: "#fafafa" }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Toolbar */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg border border-gray-200">
        {[
          { id: "select", label: "Select", icon: "🖱️" },
          { id: "pen", label: "Pen", icon: "✏️" },
          { id: "eraser", label: "Eraser", icon: "🧽" },
          { id: "highlighter", label: "Highlighter", icon: "🖍️" },
          { id: "shape", label: "Shape", icon: "🔷" },
          { id: "text", label: "Text", icon: "📝" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTool(t.id as any)}
            className={`p-2 rounded transition-colors ${
              tool === t.id
                ? "bg-emerald-100 text-emerald-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
            title={t.label}
            aria-label={t.label}
            aria-pressed={tool === t.id}
          >
            <span className="text-lg">{t.icon}</span>
          </button>
        ))}

        {/* Participants */}
        <div className="ml-4 flex items-center gap-1 border-l pl-4">
          {Array.from(awareness.values()).map((user: any) => (
            <div
              key={user.id}
              className="flex items-center gap-1 px-2 py-1 rounded text-sm"
              style={{ backgroundColor: `${user.color}20`, color: user.color }}
              title={`${user.name} (${user.currentTool || "select"})`}
            >
              <span
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: user.color }}
              />
              {user.name}
              {user.cursor && (
                <span className="ml-1 text-xs opacity-70">
                  ({Math.round(user.cursor.x)}, {Math.round(user.cursor.y)})
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Konva Stage */}
      <Stage
        ref={stageRef}
        width={containerRef.current?.clientWidth || 800}
        height={containerRef.current?.clientHeight || 600}
        onContentClick={(e) => {
          if (tool === "select" && e.target === e.currentTarget) {
            // Deselect
          }
        }}
      >
        <Layer>
          {/* Render whiteboard objects */}
          {Array.from(objects.entries()).map(([id, obj]) => {
            const isOwn = obj.userId === userId;

            if (obj.type === "stroke") {
              return (
                <Line
                  key={id}
                  points={obj.points}
                  stroke={obj.color}
                  strokeWidth={obj.width}
                  lineCap="round"
                  lineJoin="round"
                  globalCompositeOperation={obj.color === "#ffffff" ? "destination-out" : "source-over"}
                />
              );
            }

            if (obj.type === "shape") {
              return (
                <Rect
                  key={id}
                  x={obj.x}
                  y={obj.y}
                  width={obj.width}
                  height={obj.height}
                  stroke={obj.color}
                  strokeWidth={obj.width}
                  fill="transparent"
                />
              );
            }

            return null;
          })}

          {/* Current stroke being drawn */}
          {isDrawing && currentStroke.length >= 4 && (
            <Line
              points={currentStroke}
              stroke={tool === "eraser" ? TOOL_COLORS.eraser : TOOL_COLORS[tool]}
              strokeWidth={TOOL_WIDTHS[tool]}
              lineCap="round"
              lineJoin="round"
              globalCompositeOperation={tool === "eraser" ? "destination-out" : "source-over"}
            />
          )}

          {/* Remote cursors */}
          {Array.from(awareness.entries()).map(([clientId, user]) => {
            if (user.id === userId) return null;
            return (
              <Circle
                key={clientId}
                x={user.cursor?.x || 0}
                y={user.cursor?.y || 0}
                radius={8}
                fill={user.color}
                opacity={0.6}
              />
            );
          })}
        </Layer>
      </Stage>
    </div>
  );
}