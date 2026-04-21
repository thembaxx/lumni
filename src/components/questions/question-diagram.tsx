"use client";

import { useEffect, useMemo, useState } from "react";
import {
	Arrow,
	Circle,
	Group,
	Layer,
	Line,
	Rect,
	Stage,
	Text,
} from "react-konva";
import type { QADiagram } from "@/lib/types/questions";

interface ForceVectorData {
	showForces?: Array<{
		label: string;
		direction: string;
		color: string;
		origin: string;
	}>;
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
	angle?: number;
}

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

interface MotionData {
	showMotion?: boolean;
	motionType?: string;
	initialVelocity?: number;
	finalVelocity?: number;
	objects?: Array<{
		type: string;
		x: number;
		y: number;
		width?: number;
		height?: number;
		radius?: number;
		fill: string;
		label?: string;
	}>;
	angle?: number;
	trajectory?: {
		type: string;
		apex: { x: number; y: number };
	};
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
		const deg = parseInt(direction.replace("°", ""));
		const rad = (deg * Math.PI) / 180;
		return { x: Math.cos(rad), y: Math.sin(rad), rotation: deg - 90 };
	}

	return angles[direction] || angles.right;
}

function ForceVectorDiagram({ data }: { data: ForceVectorData }) {
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
							fill="#fff"
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
							fill="#fff"
							fontSize={10}
							offsetX={(obj.label?.length || 0) * 4}
							offsetY={3}
						/>
					</Group>
				);
			}
			return null;
		});
	}, [data.objects]);

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
					stroke="#6b7280"
					strokeWidth={1}
					dash={[4, 4]}
				/>
				<Text
					text={`${data.angle}°`}
					x={200}
					y={155}
					fill="#6b7280"
					fontSize={12}
					fontStyle="italic"
				/>
			</Group>
		);
	}, [data.angle]);

	return (
		<Stage
			width={300}
			height={200}
			className="w-full rounded-2xl border bg-background/40"
		>
			<Layer>{objects}</Layer>
			<Layer>{forceArrows}</Layer>
			<Layer>{angleLine}</Layer>
		</Stage>
	);
}

function CircuitDiagram({ data }: { data: CircuitData }) {
	const wireColor = "#374151";
	const componentColor = "#6366f1";
	const batteryColor = "#ef4444";
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
		return data.components.map((comp, index) => {
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
					<Group key={index}>
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
						key={index}
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
		>
			<Layer>{wires}</Layer>
			<Layer>{components}</Layer>
		</Stage>
	);
}

function WaveDiagram({ data }: { data: WaveData }) {
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
					key={w}
					points={points}
					stroke={data.sourceMoving ? "#ef4444" : "#3b82f6"}
					strokeWidth={2}
				/>,
			);
		}
		return lines;
	}, [data.showWaves, data.sourceMoving, phase, data.waveLength]);

	const source = useMemo(() => {
		if (!data.sourceMoving) return null;
		return <Circle x={30 + phase * 0.5} y={100} radius={15} fill="#ef4444" />;
	}, [data.sourceMoving, phase]);

	const photon = useMemo(() => {
		if (data.waveType !== "photon") return null;
		const lines = [];
		for (let i = 0; i < 3; i++) {
			const yOffset = (i - 1) * 15;
			lines.push(
				<Line
					key={i}
					points={[0, 100 + yOffset, 300, 100 + yOffset]}
					stroke="#fbbf24"
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

function MotionDiagram({ data }: { data: MotionData }) {
	const [animationFrame, setAnimationFrame] = useState(0);

	useEffect(() => {
		let animationId: number;
		if (data.showMotion) {
			const animate = () => {
				setAnimationFrame((f) => (f + 0.5) % 100);
				animationId = requestAnimationFrame(animate);
			};
			animationId = requestAnimationFrame(animate);
		}
		return () => cancelAnimationFrame(animationId);
	}, [data.showMotion]);

	const objects = useMemo(() => {
		if (!data.objects) return [];
		return data.objects.map((obj, index) => {
			let x = obj.x;
			let y = obj.y;

			if (obj.type === "rectangle") {
				x =
					data.motionType === "free-fall"
						? obj.x
						: obj.x + (animationFrame / 100) * 50;
				y =
					data.motionType === "vertical-up"
						? obj.y - (animationFrame / 100) * 80
						: data.motionType === "free-fall"
							? obj.y + (animationFrame / 100) * 80
							: obj.y;

				return (
					<Group key={index} x={x} y={y}>
						<Rect
							width={obj.width || 50}
							height={obj.height || 30}
							fill={obj.fill}
							cornerRadius={4}
						/>
						{obj.label && (
							<Text
								text={obj.label}
								x={(obj.width || 50) / 2}
								y={(obj.height || 30) / 2}
								fill="#fff"
								fontSize={10}
								offsetX={(obj.label.length || 0) * 4}
								offsetY={3}
							/>
						)}
					</Group>
				);
			}

			if (obj.type === "circle") {
				const baseY =
					data.motionType === "vertical-up"
						? obj.y - (animationFrame / 100) * 80
						: data.motionType === "free-fall"
							? obj.y + (animationFrame / 100) * 80
							: obj.y;
				y =
					data.motionType === "vertical-up"
						? Math.max(40, baseY)
						: data.motionType === "free-fall"
							? Math.min(170, baseY)
							: baseY;

				return (
					<Group key={index} x={x} y={y}>
						<Circle radius={obj.radius || 15} fill={obj.fill} />
						{obj.label && (
							<Text
								text={obj.label}
								fill="#fff"
								fontSize={10}
								offsetX={(obj.label.length || 0) * 4}
								offsetY={3}
							/>
						)}
					</Group>
				);
			}
			return null;
		});
	}, [data.objects, data.motionType, animationFrame]);

	const velocityLabel = useMemo(() => {
		if (data.motionType === "vertical-up" && data.initialVelocity) {
			return (
				<Group>
					<Text
						text={`v₀ = ${data.initialVelocity} m/s`}
						x={20}
						y={30}
						fill="#3b82f6"
						fontSize={12}
						fontStyle="bold"
					/>
					<Text text="↑" x={80} y={35} fill="#3b82f6" fontSize={12} />
				</Group>
			);
		}
		return null;
	}, [data.motionType, data.initialVelocity]);

	const trajectory = useMemo(() => {
		if (!data.trajectory) return null;
		return (
			<Group>
				<Line
					points={[150, 180, 150, 40]}
					stroke="#6366f1"
					strokeWidth={1}
					dash={[4, 4]}
				/>
				{data.trajectory.apex && (
					<Circle
						x={data.trajectory.apex.x}
						y={data.trajectory.apex.y}
						radius={4}
						fill="#6366f1"
					/>
				)}
			</Group>
		);
	}, [data.trajectory]);

	const angleLine = useMemo(() => {
		if (!data.angle) return null;
		return (
			<Group>
				<Line
					points={[80, 130, 180, 130]}
					stroke="#6b7280"
					strokeWidth={1}
					dash={[4, 4]}
				/>
				<Text
					text={`${data.angle}°`}
					x={130}
					y={145}
					fill="#6b7280"
					fontSize={11}
					fontStyle="italic"
				/>
			</Group>
		);
	}, [data.angle]);

	return (
		<Stage
			width={300}
			height={200}
			className="w-full rounded-2xl border bg-background/20"
		>
			<Layer>{objects}</Layer>
			<Layer>{velocityLabel}</Layer>
			<Layer>{trajectory}</Layer>
			<Layer>{angleLine}</Layer>
		</Stage>
	);
}

import { Background, Controls, MiniMap, ReactFlow } from "@xyflow/react";

function NodeDiagramFlow({
	data,
}: {
	data: {
		nodes?: Array<{
			id: string;
			type?: string;
			label: string;
			x?: number;
			y?: number;
		}>;
		edges?: Array<{ id: string; source: string; target: string }>;
	};
}) {
	const initialNodes =
		data.nodes?.map((n) => ({
			id: n.id,
			position: {
				x: n.x || Math.random() * 200,
				y: n.y || Math.random() * 200,
			},
			data: { label: n.label },
			type: n.type || "default",
		})) || [];
	const initialEdges =
		data.edges?.map((e) => ({
			id: e.id,
			source: e.source,
			target: e.target,
			type: "smoothstep",
		})) || [];

	return (
		<div className="h-75 w-full rounded-2xl border bg-background/20 overflow-hidden">
			<ReactFlow nodes={initialNodes} edges={initialEdges} fitView>
				<Background />
				<Controls />
				<MiniMap />
			</ReactFlow>
		</div>
	);
}

export function QuestionDiagram({ diagram }: { diagram: QADiagram }) {
	if (diagram.type === "node-flow" || diagram.type === "node") {
		return (
			<NodeDiagramFlow
				data={
					diagram.data as {
						nodes?: Array<{
							id: string;
							type?: string;
							label: string;
							x?: number;
							y?: number;
						}>;
						edges?: Array<{ id: string; source: string; target: string }>;
					}
				}
			/>
		);
	}

	return (
		<div className="space-y-2">
			{diagram.type === "force-vector" && (
				<ForceVectorDiagram data={diagram.data as ForceVectorData} />
			)}
			{diagram.type === "circuit" && (
				<CircuitDiagram data={diagram.data as CircuitData} />
			)}
			{diagram.type === "wave" && (
				<WaveDiagram data={diagram.data as WaveData} />
			)}
			{diagram.type === "motion" && (
				<MotionDiagram data={diagram.data as MotionData} />
			)}
		</div>
	);
}
