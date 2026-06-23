"use client";

import { useMemo } from "react";
import { Arrow, Circle, Group, Layer, Line, Rect, Stage, Text } from "react-konva";
import { useDiagramTheme } from "./diagram-theme";

interface ForceVectorData {
  objects?: Array<{
    type: string;
    x: number;
    y: number;
    width?: number;
    height?: number;
    radius?: number;
    fill: string;
    label: string;
  }>;
  showForces?: Array<{
    label: string;
    direction: string;
    color: string;
    origin: string;
  }>;
  angle?: number;
}

function getDirectionVector(direction: string): {
  x: number;
  y: number;
  rotation: number;
} {
  const angles: Record<string, { x: number; y: number; rotation: number }> = {
    right: { x: 1, y: 0, rotation: 0 },
    left: { x: -1, y: 0, rotation: 180 },
    up: { x: 0, y: -1, rotation: -90 },
    down: { x: 0, y: 1, rotation: 90 },
    "30°": { x: 0.866, y: -0.5, rotation: -30 },
    "90° perpendicular": { x: 0, y: -1, rotation: -90 },
    "up slope": { x: 0.866, y: -0.5, rotation: -30 },
    "down slope": { x: -0.866, y: 0.5, rotation: 150 },
    "270°": { x: 0, y: -1, rotation: -90 },
  };

  if (direction.includes("°") && !angles[direction]) {
    const deg = parseInt(direction.replace("°", ""), 10);
    const rad = (deg * Math.PI) / 180;
    return { x: Math.cos(rad), y: Math.sin(rad), rotation: deg - 90 };
  }

  return angles[direction] || angles.right;
}

export function ForceVectorDiagram({ data }: { data: ForceVectorData }) {
  const palette = useDiagramTheme();
  const objects = useMemo(() => {
    if (!data.objects) return [];
    return data.objects.map((obj) => {
      if (obj.type === "rectangle") {
        return (
          <Group key={obj.label} x={obj.x} y={obj.y}>
            <Rect
              width={obj.width || 50}
              height={obj.height || 30}
              fill={obj.fill}
              cornerRadius={4}
            />
            <Text
              text={obj.label}
              x={(obj.width || 50) / 2}
              y={(obj.height || 30) / 2}
              fill={palette.textOnFill}
              fontSize={12}
              offsetX={(obj.label?.length || 0) * 5}
              offsetY={4}
            />
          </Group>
        );
      }
      if (obj.type === "circle") {
        return (
          <Group key={obj.label} x={obj.x} y={obj.y}>
            <Circle radius={obj.radius || 15} fill={obj.fill} />
            <Text
              text={obj.label}
              fill={palette.textOnFill}
              fontSize={10}
              offsetX={(obj.label?.length || 0) * 4}
              offsetY={3}
            />
          </Group>
        );
      }
      return null;
    });
  }, [data.objects, palette]);

  const forceArrows = useMemo(() => {
    if (!data.showForces) return [];
    return data.showForces.map((force, index) => {
      const dir = getDirectionVector(force.direction);
      const startX = 150 + index * 20;
      const startY = 90;
      const length = 40;
      const endX = startX + dir.x * length;
      const endY = startY + dir.y * length;
      return (
        <Group key={force.label}>
          <Arrow
            points={[startX, startY, endX, endY]}
            stroke={force.color}
            fill={force.color}
            strokeWidth={2}
            pointerLength={8}
            pointerWidth={8}
          />
          <Text
            text={force.label}
            x={endX + dir.x * 15}
            y={endY + dir.y * 15}
            fill={force.color}
            fontSize={11}
            fontStyle="bold"
          />
        </Group>
      );
    });
  }, [data.showForces]);

  const angleLine = useMemo(() => {
    if (!data.angle) return null;
    return (
      <Group>
        <Line
          points={[150, 140, 250, 140]}
          stroke={palette.textSecondary}
          strokeWidth={1}
          dash={[4, 4]}
        />
        <Text
          text={`${data.angle}°`}
          x={200}
          y={155}
          fill={palette.textPrimary}
          fontSize={12}
          fontStyle="italic"
        />
      </Group>
    );
  }, [data.angle, palette]);

  return (
    <Stage
      width={300}
      height={200}
      className="w-full rounded-2xl border bg-background/40"
      ariaLabel="Force vector diagram"
    >
      <Layer>{objects}</Layer>
      <Layer>{forceArrows}</Layer>
      <Layer>{angleLine}</Layer>
    </Stage>
  );
}
