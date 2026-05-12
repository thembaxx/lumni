"use client";

import { useEffect, useMemo, useState } from "react";
import { Circle, Layer, Line, Stage } from "react-konva";

interface WaveData {
	showWaves?: boolean;
	sourceMoving?: boolean;
	direction?: string;
	frequency?: number;
	waveLength?: number;
	waveType?: string;
	compression?: boolean;
	photonEnergy?: number;
	waveform?: string;
}

export function WaveDiagram({ data }: { data: WaveData }) {
	const [phase, setPhase] = useState(0);

	useEffect(() => {
		let animationId: number;
		if (data.showWaves) {
			const animate = () => {
				setPhase((p) => (p + 0.1) % 100);
				animationId = requestAnimationFrame(animate);
			};
			animationId = requestAnimationFrame(animate);
		}
		return () => cancelAnimationFrame(animationId);
	}, [data.showWaves]);

	const waveLines = useMemo(() => {
		if (!data.showWaves) return [];
		const amplitude = 30;
		const wavelength = data.waveLength || 50;
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
						data.sourceMoving
							? "oklch(59.3% 0.194 28°)"
							: "oklch(57.7% 0.184 264°)"
					}
					strokeWidth={2}
				/>,
			);
		}
		return lines;
	}, [data.showWaves, data.sourceMoving, phase, data.waveLength]);

	const source = useMemo(() => {
		if (!data.sourceMoving) return null;
		return (
			<Circle
				x={30 + phase * 0.5}
				y={100}
				radius={15}
				fill="oklch(59.3% 0.194 28°)"
			/>
		);
	}, [data.sourceMoving, phase]);

	const photon = useMemo(() => {
		if (data.waveType !== "photon") return null;
		const lines = [];
		for (let i = 0; i < 3; i++) {
			const yOffset = (i - 1) * 15;
			lines.push(
				<Line
					key={`photon-${i}`}
					points={[0, 100 + yOffset, 300, 100 + yOffset]}
					stroke="oklch(81.9% 0.145 80°)"
					strokeWidth={3}
					dash={[5, 5]}
				/>,
			);
		}
		return lines;
	}, [data.waveType]);

	return (
		<Stage
			width={300}
			height={200}
			className="w-full rounded-2xl border bg-background/40"
		>
			<Layer>{waveLines}</Layer>
			<Layer>{source}</Layer>
			<Layer>{photon}</Layer>
		</Stage>
	);
}
