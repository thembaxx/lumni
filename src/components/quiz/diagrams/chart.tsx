"use client";

import { useMemo } from "react";
import { Arc, Circle, Group, Layer, Line, Rect, Stage, Text } from "react-konva";
import { useDiagramTheme, type DiagramColors } from "./diagram-theme";

interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

interface ChartData {
  chartType: "bar" | "line" | "pie";
  title?: string;
  data: ChartDataPoint[];
  xLabel?: string;
  yLabel?: string;
}

const CHART_WIDTH = 350;
const CHART_HEIGHT = 250;
const PADDING = { top: 30, right: 20, bottom: 50, left: 60 };
const PLOT_WIDTH = CHART_WIDTH - PADDING.left - PADDING.right;
const PLOT_HEIGHT = CHART_HEIGHT - PADDING.top - PADDING.bottom;

function BarChart({ data, palette }: { data: ChartDataPoint[]; palette: DiagramColors }) {
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const barWidth = Math.max(10, PLOT_WIDTH / data.length - 8);

  const chartColors = [
    palette.chart1,
    palette.chart2,
    palette.chart3,
    palette.chart4,
    palette.chart5,
    palette.chart6,
  ];
  const bars = data.map((d, i) => {
    const barH = (d.value / maxVal) * PLOT_HEIGHT;
    const x = PADDING.left + i * (barWidth + 8) + 4;
    const y = PADDING.top + PLOT_HEIGHT - barH;
    return (
      <Group key={d.label}>
        <Rect
          x={x}
          y={y}
          width={barWidth}
          height={barH}
          fill={d.color || chartColors[i % chartColors.length]}
          cornerRadius={2}
        />
        <Text
          x={x + barWidth / 2}
          y={PADDING.top + PLOT_HEIGHT + 4}
          text={d.label}
          fontSize={9}
          fill={palette.textSecondary}
          offsetX={barWidth / 2}
          rotation={d.label.length > 5 ? -30 : 0}
        />
        <Text
          x={x + barWidth / 2}
          y={y - 14}
          text={String(d.value)}
          fontSize={9}
          fill={palette.textSecondary}
          offsetX={barWidth / 2}
        />
      </Group>
    );
  });

  return (
    <Layer>
      <Line
        points={[PADDING.left, PADDING.top, PADDING.left, PADDING.top + PLOT_HEIGHT]}
        stroke={palette.line}
        strokeWidth={1}
      />
      <Line
        points={[
          PADDING.left,
          PADDING.top + PLOT_HEIGHT,
          PADDING.left + PLOT_WIDTH,
          PADDING.top + PLOT_HEIGHT,
        ]}
        stroke={palette.line}
        strokeWidth={1}
      />
      {bars}
    </Layer>
  );
}

function LineChart({ data, palette }: { data: ChartDataPoint[]; palette: DiagramColors }) {
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const stepX = PLOT_WIDTH / (data.length - 1 || 1);

  const points = data.flatMap((d, i) => [
    PADDING.left + i * stepX,
    PADDING.top + PLOT_HEIGHT - (d.value / maxVal) * PLOT_HEIGHT,
  ]);

  const labels = data.map((d, i) => (
    <Text
      key={`label-${d.label}`}
      x={PADDING.left + i * stepX - 15}
      y={PADDING.top + PLOT_HEIGHT + 4}
      text={d.label}
      fontSize={9}
      fill={palette.textSecondary}
      width={30}
      align="center"
    />
  ));

  const dots = data.map((d, i) => {
    const cx = PADDING.left + i * stepX;
    const cy = PADDING.top + PLOT_HEIGHT - (d.value / maxVal) * PLOT_HEIGHT;
    return (
      <Group key={`dot-${d.label}`}>
        <Circle x={cx} y={cy} radius={4} fill={palette.accent} />
        <Text
          x={cx - 10}
          y={cy - 16}
          text={String(d.value)}
          fontSize={9}
          fill={palette.textSecondary}
          width={20}
          align="center"
        />
      </Group>
    );
  });

  return (
    <Layer>
      <Line
        points={[PADDING.left, PADDING.top, PADDING.left, PADDING.top + PLOT_HEIGHT]}
        stroke={palette.line}
        strokeWidth={1}
      />
      <Line
        points={[
          PADDING.left,
          PADDING.top + PLOT_HEIGHT,
          PADDING.left + PLOT_WIDTH,
          PADDING.top + PLOT_HEIGHT,
        ]}
        stroke={palette.line}
        strokeWidth={1}
      />
      <Line points={points} stroke={palette.chart1} strokeWidth={2} tension={0.3} />
      {dots}
      {labels}
    </Layer>
  );
}

function PieChart({ data, palette }: { data: ChartDataPoint[]; palette: DiagramColors }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const cx = CHART_WIDTH / 2;
  const cy = CHART_HEIGHT / 2 - 10;
  const radius = 80;

  if (total === 0) {
    return (
      <Layer>
        <Circle
          x={cx}
          y={cy}
          radius={radius}
          fill={palette.grid}
          stroke={palette.line}
          strokeWidth={1}
        />
        <Text x={cx - 30} y={cy - 5} text="No data" fontSize={12} fill={palette.textSecondary} />
      </Layer>
    );
  }

  const chartColors = [
    palette.chart1,
    palette.chart2,
    palette.chart3,
    palette.chart4,
    palette.chart5,
    palette.chart6,
  ];
  const angleData = data.reduce<{ start: number; sliceAngle: number }[]>((acc, d) => {
    const sliceAngle = (d.value / total) * 360;
    const start = acc.length === 0 ? 0 : acc[acc.length - 1].start + acc[acc.length - 1].sliceAngle;
    acc.push({ start, sliceAngle });
    return acc;
  }, []);
  const slices = data.map((d, i) => {
    const { start, sliceAngle } = angleData[i];
    const midAngle = start + sliceAngle / 2;
    const midRad = (midAngle * Math.PI) / 180;
    const labelX = cx + Math.cos(midRad) * (radius * 0.65);
    const labelY = cy + Math.sin(midRad) * (radius * 0.65);

    return (
      <Group key={d.label}>
        <Arc
          x={cx}
          y={cy}
          innerRadius={0}
          outerRadius={radius}
          angle={sliceAngle}
          rotation={start}
          fill={d.color || chartColors[i % chartColors.length]}
          stroke={palette.textOnFill}
          strokeWidth={1}
        />
        <Text
          x={labelX - 15}
          y={labelY - 6}
          text={`${Math.round((d.value / total) * 100)}%`}
          fontSize={10}
          fill={palette.textOnFill}
          fontStyle="bold"
          width={30}
          align="center"
        />
      </Group>
    );
  });

  const legend = data.map((d, i) => (
    <Group key={`leg-${d.label}`}>
      <Rect
        x={PADDING.left + 10}
        y={CHART_HEIGHT - 30 + i * 12}
        width={8}
        height={8}
        fill={d.color || chartColors[i % chartColors.length]}
        cornerRadius={1}
      />
      <Text
        x={PADDING.left + 22}
        y={CHART_HEIGHT - 30 + i * 12 - 2}
        text={`${d.label} (${d.value})`}
        fontSize={8}
        fill={palette.textSecondary}
      />
    </Group>
  ));

  return (
    <Layer>
      {slices}
      {legend}
    </Layer>
  );
}

export function ChartDiagram({ data }: { data: ChartData }) {
  const palette = useDiagramTheme();
  const chartType = data.chartType || "bar";
  const chartData = useMemo(() => data.data || [], [data.data]);

  const chart = useMemo(() => {
    switch (chartType) {
      case "bar":
        return <BarChart data={chartData} palette={palette} />;
      case "line":
        return <LineChart data={chartData} palette={palette} />;
      case "pie":
        return <PieChart data={chartData} palette={palette} />;
      default:
        return <BarChart data={chartData} palette={palette} />;
    }
  }, [chartType, chartData, palette]);

  return (
    <Stage
      width={CHART_WIDTH}
      height={Math.max(CHART_HEIGHT, chartData.length * 12 + 50)}
      className="w-full rounded-2xl border bg-background/40"
      ariaLabel="Chart diagram"
    >
      {data.title && (
        <Layer>
          <Text
            x={CHART_WIDTH / 2}
            y={5}
            text={data.title}
            fontSize={13}
            fontStyle="bold"
            fill={palette.textPrimary}
            offsetX={CHART_WIDTH / 2}
            align="center"
          />
        </Layer>
      )}
      {chart}
    </Stage>
  );
}
