"use client";

import { useMemo } from "react";
import { Group, Layer, Line, Rect, Stage, Text } from "react-konva";

interface CircuitData {
	components?: Array<{
		type: string;
		x: number;
		y: number;
		voltage?: number;
		resistance?: number;
		emf?: number;
		internalResistance?: number;
		label?: string;
	}>;
	connectionType?: string;
}

export function CircuitDiagram({ data }: { data: CircuitData }) {
	const wireColor = "oklch(32.5% 0.012 264°)";
	const componentColor = "oklch(52.5% 0.142 274°)";
	const batteryColor = "oklch(59.3% 0.194 28°)";
	const x = 80;

	const wires = useMemo(
		() => (
			<Group>
				<Line points={[x, 60, x, 180]} stroke={wireColor} strokeWidth={2} />
				<Line points={[220, 60, 220, 180]} stroke={wireColor} strokeWidth={2} />
				<Line points={[x, 60, 220, 60]} stroke={wireColor} strokeWidth={2} />
				<Line points={[x, 180, 220, 180]} stroke={wireColor} strokeWidth={2} />
				<Rect x={x} y={100} width={8} height={20} fill={batteryColor} />
				<Rect x={x + 8} y={108} width={4} height={4} fill={wireColor} />
			</Group>
		),
		[],
	);

	const components = useMemo(() => {
		if (!data.components) return [];
		return data.components.map((comp, _index) => {
			if (comp.type === "resistor") {
				const rx = comp.x || 200;
				const ry = comp.y || 120;
				const points: number[] = [];
				points.push(rx - 20, ry);
				for (let i = 0; i < 4; i++) {
					points.push(rx - 15 + i * 10, ry - 5);
					points.push(rx - 10 + i * 10, ry + 5);
				}
				points.push(rx + 20, ry);
				return (
					<Group key={`comp-${comp.type}-${comp.x}-${comp.y}`}>
						<Line
							points={points}
							stroke={componentColor}
							strokeWidth={3}
							tension={0.5}
						/>
						{comp.label && (
							<Text
								text={comp.label}
								x={rx}
								y={ry + 25}
								fill={wireColor}
								fontSize={10}
								offsetX={(comp.label.length || 0) * 4}
							/>
						)}
					</Group>
				);
			}
			if (comp.label?.includes("ε") || comp.label?.includes("V")) {
				return (
					<Text
						key={`text-${comp.label}-${comp.x}-${comp.y}`}
						text={comp.label}
						x={x + 20}
						y={95}
						fill={wireColor}
						fontSize={12}
						fontStyle="bold"
					/>
				);
			}
			return null;
		});
	}, [data.components]);

	return (
		<Stage
			width={300}
			height={200}
			className="w-full rounded-2xl border bg-background/40"
			ariaLabel="Circuit diagram"
		>
			<Layer>{wires}</Layer>
			<Layer>{components}</Layer>
		</Stage>
	);
}
