"use client";

import { useMemo, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProgressDataPoint {
	date: string;
	accuracy: number;
}

interface ProgressChartProps {
	data: ProgressDataPoint[];
	title?: string;
}

function buildSmoothPath(points: { x: number; y: number }[]): string {
	if (points.length === 0) return "";
	if (points.length === 1) return `M${points[0].x},${points[0].y}`;
	const parts: string[] = [];
	for (let i = 0; i < points.length; i++) {
		const p = points[i];
		if (i === 0) {
			parts.push(`M${p.x.toFixed(1)},${p.y.toFixed(1)}`);
		} else {
			const prev = points[i - 1];
			const cp1x = prev.x + (p.x - prev.x) / 2;
			const cp1y = prev.y;
			const cp2x = prev.x + (p.x - prev.x) / 2;
			const cp2y = p.y;
			parts.push(
				`C${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p.x.toFixed(1)},${p.y.toFixed(1)}`,
			);
		}
	}
	return parts.join(" ");
}

export function ProgressChart({ data, title }: ProgressChartProps) {
	const [hovered, setHovered] = useState<number | null>(null);

	const { points, path, yTicks, xMax } = useMemo(() => {
		if (data.length === 0) {
			return { points: [], path: "", yTicks: [0, 25, 50, 75, 100], xMax: 0 };
		}
		const yMax = 100;
		const yMin = 0;
		const padding = { top: 10, right: 10, bottom: 24, left: 28 };
		const svgW = 100;
		const svgH = 100;
		const chartW = svgW - padding.left - padding.right;
		const chartH = svgH - padding.top - padding.bottom;

		const xStep = data.length > 1 ? chartW / (data.length - 1) : 0;

		const pts = data.map((d, i) => ({
			x: padding.left + i * xStep,
			y: padding.top + chartH * (1 - (d.accuracy - yMin) / (yMax - yMin)),
			date: d.date,
			accuracy: d.accuracy,
		}));

		const yTicks = [0, 25, 50, 75, 100];
		const pth = buildSmoothPath(pts);
		return { points: pts, path: pth, yTicks, xMax: svgW };
	}, [data]);

	if (data.length === 0) {
		return (
			<Card className="overflow-hidden">
				{title && (
					<CardHeader>
						<CardTitle className="text-lg font-semibold text-wrap balance">
							{title}
						</CardTitle>
					</CardHeader>
				)}
				<CardContent>
					<div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm font-medium">
						No progress data yet
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="overflow-hidden">
			{title && (
				<CardHeader>
					<CardTitle className="text-lg font-semibold text-wrap balance">
						{title}
					</CardTitle>
				</CardHeader>
			)}
			<CardContent>
				<svg
					viewBox={`0 0 ${xMax} 100`}
					className="w-full h-[250px] overflow-visible"
					preserveAspectRatio="xMidYMid meet"
					role="img"
					aria-label={title ? `${title} chart` : "Progress chart"}
				>
					{yTicks.map((tick) => {
						const y = 10 + 80 * (1 - (tick - 0) / (100 - 0));
						return (
							<g key={tick}>
								<line
									x1={28}
									y1={y}
									x2={xMax - 10}
									y2={y}
									stroke="var(--border)"
									strokeWidth="0.5"
								/>
								<text
									x={26}
									y={y + 1}
									textAnchor="end"
									fill="var(--muted-foreground)"
									fontSize="3"
									fontFamily="ui-monospace, monospace"
								>
									{tick}
								</text>
							</g>
						);
					})}

					{path && (
						<path
							d={path}
							fill="none"
							stroke="var(--primary)"
							strokeWidth="1.5"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					)}

					{points.map((p, i) => (
						<g key={i}>
							<circle
								cx={p.x}
								cy={p.y}
								r={hovered === i ? 3 : 1.5}
								fill={hovered === i ? "var(--primary)" : "var(--card)"}
								stroke="var(--primary)"
								strokeWidth="1.5"
								style={{ transition: "r 0.15s ease" }}
							/>
							<rect
								x={p.x - 6}
								y={p.y - 6}
								width={12}
								height={12}
								fill="transparent"
								onMouseEnter={() => setHovered(i)}
								onMouseLeave={() => setHovered(null)}
								style={{ cursor: "pointer" }}
							/>
							{hovered === i && (
								<g>
									<rect
										x={p.x - 10}
										y={p.y - 14}
										width={20}
										height={8}
										rx={2}
										fill="var(--background)"
										stroke="var(--border)"
										strokeWidth="0.5"
									/>
									<text
										x={p.x}
										y={p.y - 9}
										textAnchor="middle"
										fill="var(--foreground)"
										fontSize="3"
										fontWeight="600"
										fontFamily="ui-monospace, monospace"
									>
										{p.accuracy}%
									</text>
								</g>
							)}
						</g>
					))}

					{points.map((p, i) => (
						<text
							key={`label-${i}`}
							x={p.x}
							y={96}
							textAnchor="middle"
							fill="var(--muted-foreground)"
							fontSize="3"
							fontFamily="inherit"
						>
							{p.date}
						</text>
					))}
				</svg>
			</CardContent>
		</Card>
	);
}
