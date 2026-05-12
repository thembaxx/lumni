"use client";

import React, { useMemo } from "react";
import {
	Arc,
	Circle,
	Group,
	Layer,
	Line,
	RegularPolygon,
	Stage,
	Text,
} from "react-konva";

interface GeometryShape {
	type:
		| "circle"
		| "line"
		| "polygon"
		| "arc"
		| "point"
		| "angle-mark"
		| "right-angle-mark"
		| "grid"
		| "dimension";
	x: number;
	y: number;
	props: Record<string, unknown>;
	label?: string;
	labelX?: number;
	labelY?: number;
	dashed?: boolean;
	stroke?: string;
	fill?: string;
	strokeWidth?: number;
}

interface GeometryData {
	shapes: GeometryShape[];
	viewBox?: { x: number; y: number; width: number; height: number };
}

function renderShape(shape: GeometryShape, i: number) {
	const stroke = shape.stroke || "oklch(32.5% 0.012 264°)";
	const fill = shape.fill || "transparent";
	const sw = shape.strokeWidth ?? 2;

	switch (shape.type) {
		case "circle":
			return (
				<Circle
					key={i}
					x={shape.x}
					y={shape.y}
					radius={(shape.props.radius as number) || 30}
					stroke={stroke}
					strokeWidth={sw}
					fill={fill}
					dash={shape.dashed ? [6, 3] : undefined}
				/>
			);

		case "line":
			return (
				<Line
					key={i}
					points={[
						shape.x,
						shape.y,
						(shape.props.x2 as number) || 0,
						(shape.props.y2 as number) || 0,
					]}
					stroke={stroke}
					strokeWidth={sw}
					dash={shape.dashed ? [6, 3] : undefined}
				/>
			);

		case "polygon":
			return (
				<RegularPolygon
					key={i}
					x={shape.x}
					y={shape.y}
					sides={(shape.props.sides as number) || 3}
					radius={(shape.props.radius as number) || 40}
					stroke={stroke}
					strokeWidth={sw}
					fill={fill}
					rotation={(shape.props.rotation as number) || 0}
				/>
			);

		case "arc":
			return (
				<Arc
					key={i}
					x={shape.x}
					y={shape.y}
					innerRadius={0}
					outerRadius={(shape.props.outerRadius as number) || 30}
					angle={(shape.props.angle as number) || 90}
					stroke={stroke}
					strokeWidth={sw}
					fill={fill}
				/>
			);

		case "point":
			return (
				<Circle key={i} x={shape.x} y={shape.y} radius={3} fill={stroke} />
			);

		case "angle-mark":
			return (
				<Arc
					key={i}
					x={shape.x}
					y={shape.y}
					innerRadius={0}
					outerRadius={(shape.props.radius as number) || 20}
					angle={(shape.props.angle as number) || 90}
					rotation={(shape.props.rotation as number) || 0}
					stroke={stroke}
					strokeWidth={sw}
					fill={fill || "oklch(70% 0.05 80 / 0.2)"}
				/>
			);

		case "right-angle-mark":
			return (
				<Line
					key={i}
					points={[
						shape.x,
						shape.y,
						shape.x + ((shape.props.size as number) || 10),
						shape.y,
						shape.x + ((shape.props.size as number) || 10),
						shape.y - ((shape.props.size as number) || 10),
						shape.x,
						shape.y - ((shape.props.size as number) || 10),
						shape.x,
						shape.y,
					]}
					stroke={stroke}
					strokeWidth={sw}
					closed
				/>
			);

		case "grid":
			return null;

		case "dimension":
			return null;

		default:
			return null;
	}
}

function renderLabel(shape: GeometryShape, i: number) {
	if (!shape.label) return null;
	return (
		<Text
			key={`label-${i}`}
			x={shape.labelX ?? shape.x + 5}
			y={shape.labelY ?? shape.y - 20}
			text={shape.label}
			fontSize={12}
			fill={shape.stroke || "oklch(32.5% 0.012 264°)"}
			fontStyle="italic"
		/>
	);
}

export function GeometryDiagram({ data }: { data: GeometryData }) {
	const shapes = useMemo(() => data.shapes || [], [data.shapes]);

	const gridLines = useMemo(() => {
		const lines: React.ReactNode[] = [];
		if (!shapes.some((s) => s.type === "grid")) return lines;

		for (let x = 0; x <= 350; x += 25) {
			lines.push(
				<Line
					key={`gv-${x}`}
					points={[x, 0, x, 350]}
					stroke="oklch(90% 0 0)"
					strokeWidth={0.5}
				/>,
			);
		}
		for (let y = 0; y <= 350; y += 25) {
			lines.push(
				<Line
					key={`gh-${y}`}
					points={[0, y, 350, y]}
					stroke="oklch(90% 0 0)"
					strokeWidth={0.5}
				/>,
			);
		}
		return lines;
	}, [shapes]);

	return (
		<Stage
			width={400}
			height={350}
			className="w-full rounded-2xl border bg-background/40"
		>
			<Layer>
				{gridLines}
				{shapes.map((s, i) => renderShape(s, i))}
				{shapes.map((s, i) => renderLabel(s, i))}
			</Layer>
		</Stage>
	);
}
