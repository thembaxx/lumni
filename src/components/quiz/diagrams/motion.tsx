"use client";

import { useEffect, useMemo, useState } from "react";
import { Circle, Group, Layer, Line, Stage, Text } from "react-konva";
import type { MotionData } from "@/lib/visual-engine/types";

export function MotionDiagram({ data }: { data: MotionData }) {
	const [animationFrame, setAnimationFrame] = useState(0);

	useEffect(() => {
		let animationId: number;
		if (data.projectiles && data.projectiles.length > 0) {
			const animate = () => {
				setAnimationFrame((f) => (f + 0.5) % 100);
				animationId = requestAnimationFrame(animate);
			};
			animationId = requestAnimationFrame(animate);
		}
		return () => cancelAnimationFrame(animationId);
	}, [data.projectiles]);

	const projectileElements = useMemo(() => {
		if (!data.projectiles) return [];
		return data.projectiles.map((p) => {
			const t = animationFrame / 100;
			const cx = p.startX + (p.endX - p.startX) * t;
			const cy = p.startY + (p.endY - p.startY) * t;

			return (
				<Group key={`proj-${p.startX}-${p.startY}-${p.endX}-${p.endY}`}>
					<Circle
						x={cx}
						y={cy}
						radius={6}
						fill={p.color || "oklch(55.6% 0.219 264)"}
						stroke="oklch(100% 0 0)"
						strokeWidth={1}
					/>
					{p.label && (
						<Text
							x={cx + 8}
							y={cy - 10}
							text={p.label}
							fontSize={10}
							fill="oklch(32.5% 0.012 264°)"
						/>
					)}
				</Group>
			);
		});
	}, [data.projectiles, animationFrame]);

	const pathElements = useMemo(() => {
		if (!data.paths) return [];
		return data.paths.map((path) => {
			const pts = path.points.flatMap((pt) => [pt.x, pt.y]);
			return (
				<Line
					key={`path-${path.color}-${path.dashed}`}
					points={pts}
					stroke={path.color || "oklch(52.5% 0.142 274°)"}
					strokeWidth={2}
					dash={path.dashed ? [6, 4] : undefined}
					tension={0.3}
				/>
			);
		});
	}, [data.paths]);

	const labels = useMemo(() => {
		if (!data.labels) return [];
		return data.labels.map((l) => (
			<Text
				key={`label-${l.text}-${l.x}-${l.y}`}
				x={l.x}
				y={l.y}
				text={l.text}
				fontSize={11}
				fill="oklch(52.9% 0.012 264°)"
				fontStyle="italic"
			/>
		));
	}, [data.labels]);

	return (
		<Stage
			width={300}
			height={200}
			className="w-full rounded-2xl border bg-background/20"
			ariaLabel="Motion diagram"
		>
			<Layer>
				{data.ground && (
					<Line
						points={[0, 180, 300, 180]}
						stroke="oklch(52.9% 0.012 264°)"
						strokeWidth={2}
					/>
				)}
				{pathElements}
				{projectileElements}
				{labels}
			</Layer>
		</Stage>
	);
}
