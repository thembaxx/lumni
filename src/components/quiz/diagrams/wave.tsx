"use client";

import { useEffect, useMemo, useState } from "react";
import { Circle, Group, Layer, Line, Stage, Text } from "react-konva";
import type { WaveData } from "@/lib/visual-engine/types";

export function WaveDiagram({ data }: { data: WaveData }) {
	const [phase, setPhase] = useState(0);

	useEffect(() => {
		let animationId: number;
		if (data.type === "transverse" || data.type === "standing") {
			const animate = () => {
				setPhase((p) => (p + 0.1) % 100);
				animationId = requestAnimationFrame(animate);
			};
			animationId = requestAnimationFrame(animate);
		}
		return () => cancelAnimationFrame(animationId);
	}, [data.type]);

	const waveLines = useMemo(() => {
		if (data.type !== "transverse" && data.type !== "standing") return [];
		const amplitude = data.amplitude || 30;
		const wavelength = data.wavelength || 50;
		const lines = [];
		const numWaves = 5;

		for (let w = 0; w < numWaves; w++) {
			const points: number[] = [];
			for (let x = 0; x < 300; x++) {
				const y =
					100 +
					amplitude *
						Math.sin(
							((x + phase) * 2 * Math.PI) / wavelength - (w * Math.PI) / 2,
						);
				points.push(x, y);
			}
			lines.push(
				<Line
					key={`wave-${w}`}
					points={points}
					stroke={
						w === 0 ? "oklch(59.3% 0.194 28°)" : "oklch(57.7% 0.184 264° 0.3)"
					}
					strokeWidth={w === 0 ? 2.5 : 1}
				/>,
			);
		}
		return lines;
	}, [data.type, data.amplitude, data.wavelength, phase]);

	const longitudinalWaves = useMemo(() => {
		if (data.type !== "longitudinal" && data.type !== "sound") return [];
		const wavelength = data.wavelength || 50;
		const elements = [];
		for (let w = 0; w < 8; w++) {
			const x = 30 + w * wavelength + phase;
			const radius = 4 + 8 * Math.sin((w * Math.PI) / 2 + phase * 0.1);
			elements.push(
				<Group key={`long-${w}`}>
					<Circle
						x={x}
						y={100}
						radius={Math.abs(radius)}
						fill={`oklch(${50 + radius * 2}% 0.1 264)`}
						opacity={0.8}
					/>
					<Text
						x={x - 4}
						y={97}
						text={w % 2 === 0 ? "C" : "R"}
						fontSize={7}
						fill="oklch(100% 0 0)"
					/>
				</Group>,
			);
		}
		return elements;
	}, [data.type, data.wavelength, phase]);

	const labels = useMemo(() => {
		if (!data.labels) return [];
		return data.labels.map((l, i) => (
			<Text
				key={`label-${i}`}
				x={l.x}
				y={l.y}
				text={l.text}
				fontSize={10}
				fill="oklch(52.9% 0.012 264°)"
			/>
		));
	}, [data.labels]);

	const photonVisual = useMemo(() => {
		if (!data.showPhoton) return null;
		const lines = [];
		for (let i = 0; i < 3; i++) {
			const yOffset = (i - 1) * 15;
			lines.push(
				<Line
					key={`photon-${i}`}
					points={[0, 100 + yOffset, 300, 100 + yOffset]}
					stroke="oklch(81.9% 0.145 80° 0.5)"
					strokeWidth={2}
					dash={[5, 5]}
				/>,
			);
		}
		return lines;
	}, [data.showPhoton]);

	const amplitudeLabel = useMemo(() => {
		if (!data.amplitude) return null;
		return (
			<Group>
				<Line
					points={[20, 70, 20, 130]}
					stroke="oklch(52.9% 0.012 264°)"
					strokeWidth={1}
					dash={[3, 3]}
				/>
				<Text
					x={5}
					y={90}
					text={`A=${data.amplitude}`}
					fontSize={9}
					fill="oklch(52.9% 0.012 264°)"
					rotation={-90}
				/>
			</Group>
		);
	}, [data.amplitude]);

	return (
		<Stage
			width={300}
			height={200}
			className="w-full rounded-2xl border bg-background/40"
		>
			<Layer>{waveLines}</Layer>
			<Layer>{longitudinalWaves}</Layer>
			<Layer>{amplitudeLabel}</Layer>
			<Layer>{labels}</Layer>
			<Layer>{photonVisual}</Layer>
		</Stage>
	);
}
