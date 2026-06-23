"use client";

import type React from "react";
import { useMemo } from "react";
import { Circle, Group, Layer, Line, Stage, Text } from "react-konva";
import { useDiagramTheme } from "./diagram-theme";

interface GraphFunction {
  label?: string;
  color?: string;
  points: Array<{ x: number; y: number }>;
  dashed?: boolean;
}

interface GraphAxes {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

interface GraphAsymptote {
  type: "vertical" | "horizontal";
  value: number;
  color?: string;
}

interface GraphPoint {
  x: number;
  y: number;
  label?: string;
  color?: string;
}

interface GraphData {
  functions: GraphFunction[];
  axes: GraphAxes;
  xLabel?: string;
  yLabel?: string;
  title?: string;
  showGrid?: boolean;
  asymptotes?: GraphAsymptote[];
  points?: GraphPoint[];
}

const GRAPH_W = 350;
const GRAPH_H = 300;
const PAD = { top: 20, right: 20, bottom: 40, left: 50 };
const PLOT_W = GRAPH_W - PAD.left - PAD.right;
const PLOT_H = GRAPH_H - PAD.top - PAD.bottom;

function safeAxisRange(min: number, max: number): { min: number; max: number } {
  if (max - min < 0.001) {
    const mid = (min + max) / 2;
    return { min: mid - 5, max: mid + 5 };
  }
  return { min, max };
}

function mapX(x: number, axes: GraphAxes): number {
  const r = safeAxisRange(axes.xMin, axes.xMax);
  return PAD.left + ((x - r.min) / (r.max - r.min)) * PLOT_W;
}

function mapY(y: number, axes: GraphAxes): number {
  const r = safeAxisRange(axes.yMin, axes.yMax);
  return PAD.top + PLOT_H - ((y - r.min) / (r.max - r.min)) * PLOT_H;
}

export function GraphDiagram({ data }: { data: GraphData }) {
  const palette = useDiagramTheme();
  const axes = useMemo(
    () => data.axes || { xMin: -10, xMax: 10, yMin: -10, yMax: 10 },
    [data.axes],
  );
  const showGrid = data.showGrid ?? true;

  const gridLines = useMemo(() => {
    if (!showGrid) return [];
    const lines: React.ReactNode[] = [];
    const step = (axes.xMax - axes.xMin) / 10;
    const yStep = (axes.yMax - axes.yMin) / 10;

    for (let v = Math.ceil(axes.xMin / step) * step; v <= axes.xMax; v += step) {
      if (Math.abs(v) < 0.001) continue;
      const x = mapX(v, axes);
      lines.push(
        <Line
          key={`gv-${v}`}
          points={[x, PAD.top, x, PAD.top + PLOT_H]}
          stroke={palette.grid}
          strokeWidth={0.5}
        />,
      );
    }

    for (let v = Math.ceil(axes.yMin / yStep) * yStep; v <= axes.yMax; v += yStep) {
      if (Math.abs(v) < 0.001) continue;
      const y = mapY(v, axes);
      lines.push(
        <Line
          key={`gh-${v}`}
          points={[PAD.left, y, PAD.left + PLOT_W, y]}
          stroke={palette.grid}
          strokeWidth={0.5}
        />,
      );
    }

    return lines;
  }, [axes, showGrid, palette]);

  const axisElements = useMemo(() => {
    const originX = axes.xMin <= 0 && axes.xMax >= 0 ? mapX(0, axes) : PAD.left;
    const originY = axes.yMin <= 0 && axes.yMax >= 0 ? mapY(0, axes) : PAD.top + PLOT_H;

    const elements: React.ReactNode[] = [
      <Line
        key="x-axis"
        points={[PAD.left, originY, PAD.left + PLOT_W, originY]}
        stroke={palette.lineStrong}
        strokeWidth={1.5}
      />,
      <Line
        key="y-axis"
        points={[originX, PAD.top, originX, PAD.top + PLOT_H]}
        stroke={palette.lineStrong}
        strokeWidth={1.5}
      />,
    ];

    const xStep = (axes.xMax - axes.xMin) / 10;
    for (let v = Math.ceil(axes.xMin / xStep) * xStep; v <= axes.xMax; v += xStep) {
      if (Math.abs(v) < 0.001) continue;
      const x = mapX(v, axes);
      elements.push(
        <Line
          key={`xt-${v}`}
          points={[x, originY - 4, x, originY + 4]}
          stroke={palette.lineStrong}
          strokeWidth={1}
        />,
      );
      elements.push(
        <Text
          key={`xl-${v}`}
          x={x - 15}
          y={originY + 6}
          text={String(v === Math.round(v) ? v : v.toFixed(1))}
          fontSize={8}
          fill={palette.textSecondary}
          width={30}
          align="center"
        />,
      );
    }

    const yStep = (axes.yMax - axes.yMin) / 10;
    for (let v = Math.ceil(axes.yMin / yStep) * yStep; v <= axes.yMax; v += yStep) {
      if (Math.abs(v) < 0.001) continue;
      const y = mapY(v, axes);
      elements.push(
        <Line
          key={`yt-${v}`}
          points={[originX - 4, y, originX + 4, y]}
          stroke={palette.lineStrong}
          strokeWidth={1}
        />,
      );
      elements.push(
        <Text
          key={`yl-${v}`}
          x={originX - 42}
          y={y - 5}
          text={String(v === Math.round(v) ? v : v.toFixed(1))}
          fontSize={8}
          fill={palette.textSecondary}
          width={35}
          align="right"
        />,
      );
    }

    if (data.xLabel) {
      elements.push(
        <Text
          key="x-label"
          x={PAD.left + PLOT_W / 2 - 20}
          y={GRAPH_H - 5}
          text={data.xLabel}
          fontSize={10}
          fill={palette.textPrimary}
          fontStyle="italic"
        />,
      );
    }
    if (data.yLabel) {
      elements.push(
        <Text
          key="y-label"
          x={5}
          y={PAD.top + PLOT_H / 2 - 20}
          text={data.yLabel}
          fontSize={10}
          fill={palette.textPrimary}
          fontStyle="italic"
          rotation={-90}
        />,
      );
    }

    return elements;
  }, [axes, data.xLabel, data.yLabel, palette]);

  const functionLines = useMemo(() => {
    const colors = [
      palette.chart1,
      palette.chart2,
      palette.chart3,
      palette.chart4,
      palette.chart5,
      palette.chart6,
    ];
    return (data.functions || []).map((fn, i) => {
      const pts = fn.points.flatMap((p) => {
        const px = mapX(p.x, axes);
        const py = mapY(p.y, axes);
        return [px, py];
      });

      return (
        <Line
          key={`fn-${fn.label ?? fn.color ?? fn.points.length}`}
          points={pts}
          stroke={fn.color || colors[i % colors.length]}
          strokeWidth={2.5}
          dash={fn.dashed ? [8, 4] : undefined}
          tension={0.3}
        />
      );
    });
  }, [axes, data.functions, palette]);

  const asymptoteLines = useMemo(() => {
    return (data.asymptotes || []).map((a) => {
      if (a.type === "vertical") {
        const x = mapX(a.value, axes);
        return (
          <Line
            key={`as-${a.type}-${a.value}`}
            points={[x, PAD.top, x, PAD.top + PLOT_H]}
            stroke={a.color || "oklch(60% 0.2 30)"}
            strokeWidth={1.5}
            dash={[6, 4]}
          />
        );
      }
      const y = mapY(a.value, axes);
      return (
        <Line
          key={`as-${a.type}-${a.value}`}
          points={[PAD.left, y, PAD.left + PLOT_W, y]}
          stroke={a.color || "oklch(60% 0.2 30)"}
          strokeWidth={1.5}
          dash={[6, 4]}
        />
      );
    });
  }, [axes, data.asymptotes]);

  const markedPoints = useMemo(() => {
    return (data.points || []).map((p) => {
      const px = mapX(p.x, axes);
      const py = mapY(p.y, axes);
      return (
        <Group key={`pt-${p.x}-${p.y}`}>
          <Circle
            x={px}
            y={py}
            radius={4}
            fill={p.color || palette.chart1}
            stroke={palette.textOnFill}
            strokeWidth={1}
          />
          {p.label && (
            <Text
              x={px + 6}
              y={py - 10}
              text={p.label}
              fontSize={10}
              fill={palette.textPrimary}
              fontStyle="bold"
            />
          )}
        </Group>
      );
    });
  }, [axes, data.points, palette]);

  return (
    <Stage
      width={GRAPH_W}
      height={GRAPH_H}
      className="w-full rounded-2xl border bg-background/40"
      ariaLabel="Mathematical graph with axes and curves"
    >
      <Layer>
        {gridLines}
        {axisElements}
        {asymptoteLines}
        {functionLines}
        {markedPoints}
        {data.title && (
          <Text
            x={GRAPH_W / 2}
            y={3}
            text={data.title}
            fontSize={12}
            fontStyle="bold"
            fill={palette.textPrimary}
            offsetX={GRAPH_W / 2}
            align="center"
          />
        )}
      </Layer>
    </Stage>
  );
}
