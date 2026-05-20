"use client";

import { useMemo } from "react";
import {
	Arc,
	Circle,
	Group,
	Layer,
	Line,
	Rect,
	Stage,
	Text,
} from "react-konva";

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

const COLORS = [
	"oklch(55.6% 0.219 264)",
	"oklch(60.7% 0.196 28)",
	"oklch(59.6% 0.171 164)",
	"oklch(55.4% 0.172 333)",
	"oklch(56.1% 0.155 50)",
	"oklch(52.6% 0.142 302)",
];

function BarChart({ data }: { data: ChartDataPoint[] }) {
	const maxVal = Math.max(...data.map((d) => d.value), 1);
	const barWidth = Math.max(10, PLOT_WIDTH / data.length - 8);

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
					fill={d.color || COLORS[i % COLORS.length]}
					cornerRadius={2}
				/>
				<Text
					x={x + barWidth / 2}
					y={PADDING.top + PLOT_HEIGHT + 4}
					text={d.label}
					fontSize={9}
					fill="oklch(52.9% 0.012 264°)"
					offsetX={barWidth / 2}
					rotation={d.label.length > 5 ? -30 : 0}
				/>
				<Text
					x={x + barWidth / 2}
					y={y - 14}
					text={String(d.value)}
					fontSize={9}
					fill="oklch(52.9% 0.012 264°)"
					offsetX={barWidth / 2}
				/>
			</Group>
		);
	});

	return (
		<Layer>
			<Line
				points={[
					PADDING.left,
					PADDING.top,
					PADDING.left,
					PADDING.top + PLOT_HEIGHT,
				]}
				stroke="oklch(70% 0 0)"
				strokeWidth={1}
			/>
			<Line
				points={[
					PADDING.left,
					PADDING.top + PLOT_HEIGHT,
					PADDING.left + PLOT_WIDTH,
					PADDING.top + PLOT_HEIGHT,
				]}
				stroke="oklch(70% 0 0)"
				strokeWidth={1}
			/>
			{bars}
		</Layer>
	);
}

function LineChart({ data }: { data: ChartDataPoint[] }) {
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
			fill="oklch(52.9% 0.012 264°)"
			width={30}
			align="center"
		/>
	));

	const dots = data.map((d, i) => {
		const cx = PADDING.left + i * stepX;
		const cy = PADDING.top + PLOT_HEIGHT - (d.value / maxVal) * PLOT_HEIGHT;
		return (
			<Group key={`dot-${d.label}`}>
				<Circle x={cx} y={cy} radius={4} fill="oklch(52.5% 0.142 274°)" />
				<Text
					x={cx - 10}
					y={cy - 16}
					text={String(d.value)}
					fontSize={9}
					fill="oklch(52.9% 0.012 264°)"
					width={20}
					align="center"
				/>
			</Group>
		);
	});

	return (
		<Layer>
			<Line
				points={[
					PADDING.left,
					PADDING.top,
					PADDING.left,
					PADDING.top + PLOT_HEIGHT,
				]}
				stroke="oklch(70% 0 0)"
				strokeWidth={1}
			/>
			<Line
				points={[
					PADDING.left,
					PADDING.top + PLOT_HEIGHT,
					PADDING.left + PLOT_WIDTH,
					PADDING.top + PLOT_HEIGHT,
				]}
				stroke="oklch(70% 0 0)"
				strokeWidth={1}
			/>
			<Line
				points={points}
				stroke="oklch(55.6% 0.219 264)"
				strokeWidth={2}
				tension={0.3}
			/>
			{dots}
			{labels}
		</Layer>
	);
}

function PieChart({ data }: { data: ChartDataPoint[] }) {
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
					fill="oklch(90% 0 0)"
					stroke="oklch(70% 0 0)"
					strokeWidth={1}
				/>
				<Text
					x={cx - 30}
					y={cy - 5}
					text="No data"
					fontSize={12}
					fill="oklch(52.9% 0.012 264°)"
				/>
			</Layer>
		);
	}

	let currentAngle = 0;
	const slices = data.map((d, i) => {
		const sliceAngle = (d.value / total) * 360;
		const start = currentAngle;
		currentAngle += sliceAngle;
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
					fill={d.color || COLORS[i % COLORS.length]}
					stroke="oklch(100% 0 0)"
					strokeWidth={1}
				/>
				<Text
					x={labelX - 15}
					y={labelY - 6}
					text={`${Math.round((d.value / total) * 100)}%`}
					fontSize={10}
					fill="oklch(100% 0 0)"
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
				fill={d.color || COLORS[i % COLORS.length]}
				cornerRadius={1}
			/>
			<Text
				x={PADDING.left + 22}
				y={CHART_HEIGHT - 30 + i * 12 - 2}
				text={`${d.label} (${d.value})`}
				fontSize={8}
				fill="oklch(52.9% 0.012 264°)"
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
	const chartType = data.chartType || "bar";
	const chartData = useMemo(() => data.data || [], [data.data]);

	const chart = useMemo(() => {
		switch (chartType) {
			case "bar":
				return <BarChart data={chartData} />;
			case "line":
				return <LineChart data={chartData} />;
			case "pie":
				return <PieChart data={chartData} />;
			default:
				return <BarChart data={chartData} />;
		}
	}, [chartType, chartData]);

	return (
		<Stage
			width={CHART_WIDTH}
			height={Math.max(CHART_HEIGHT, chartData.length * 12 + 50)}
			className="w-full rounded-2xl border bg-background/40"
		>
			{data.title && (
				<Layer>
					<Text
						x={CHART_WIDTH / 2}
						y={5}
						text={data.title}
						fontSize={13}
						fontStyle="bold"
						fill="oklch(32.5% 0.012 264°)"
						offsetX={CHART_WIDTH / 2}
						align="center"
					/>
				</Layer>
			)}
			{chart}
		</Stage>
	);
}
