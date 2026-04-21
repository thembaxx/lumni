"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
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
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const dpr = window.devicePixelRatio || 1;
		const rect = canvas.getBoundingClientRect();
		canvas.width = rect.width * dpr;
		canvas.height = rect.height * dpr;
		ctx.scale(dpr, dpr);

		ctx.clearRect(0, 0, rect.width, rect.height);

		if (data.objects) {
			data.objects.forEach((obj) => {
				if (obj.type === "rectangle") {
					ctx.fillStyle = obj.fill;
					ctx.fillRect(obj.x, obj.y, obj.width || 50, obj.height || 30);
					if (obj.label) {
						ctx.fillStyle = "#fff";
						ctx.font = "12px sans-serif";
						ctx.textAlign = "center";
						ctx.fillText(
							obj.label,
							obj.x + (obj.width || 50) / 2,
							obj.y + (obj.height || 30) / 2 + 4,
						);
					}
				} else if (obj.type === "circle") {
					ctx.beginPath();
					ctx.arc(obj.x, obj.y, obj.radius || 15, 0, Math.PI * 2);
					ctx.fillStyle = obj.fill;
					ctx.fill();
					if (obj.label) {
						ctx.fillStyle = "#fff";
						ctx.font = "10px sans-serif";
						ctx.textAlign = "center";
						ctx.fillText(obj.label, obj.x, obj.y + 3);
					}
				}
			});
		}

		if (data.showForces) {
			data.showForces.forEach((force, index) => {
				const dir = getDirectionVector(force.direction);
				const startX = 150 + index * 20;
				const startY = 90;
				const length = 40;

				ctx.strokeStyle = force.color;
				ctx.lineWidth = 2;
				ctx.beginPath();
				ctx.moveTo(startX, startY);
				ctx.lineTo(startX + dir.x * length, startY + dir.y * length);
				ctx.stroke();

				const arrowSize = 8;
				const angle = Math.atan2(dir.y, dir.x);
				ctx.beginPath();
				ctx.moveTo(startX + dir.x * length, startY + dir.y * length);
				ctx.lineTo(
					startX + dir.x * length - arrowSize * Math.cos(angle - Math.PI / 6),
					startY + dir.y * length - arrowSize * Math.sin(angle - Math.PI / 6),
				);
				ctx.lineTo(
					startX + dir.x * length - arrowSize * Math.cos(angle + Math.PI / 6),
					startY + dir.y * length - arrowSize * Math.sin(angle + Math.PI / 6),
				);
				ctx.closePath();
				ctx.fillStyle = force.color;
				ctx.fill();

				ctx.fillStyle = force.color;
				ctx.font = "bold 11px sans-serif";
				ctx.textAlign = "center";
				ctx.fillText(
					force.label,
					startX + dir.x * (length + 15),
					startY + dir.y * (length + 15),
				);
			});
		}

		if (data.angle) {
			ctx.strokeStyle = "#6b7280";
			ctx.lineWidth = 1;
			ctx.setLineDash([4, 4]);
			ctx.beginPath();
			ctx.moveTo(150, 140);
			ctx.lineTo(250, 140);
			ctx.stroke();
			ctx.setLineDash([]);

			ctx.fillStyle = "#6b7280";
			ctx.font = "italic 12px sans-serif";
			ctx.fillText(`${data.angle}°`, 200, 155);
		}
	}, [data]);

	return (
		<canvas
			ref={canvasRef}
			className="w-full rounded-2xl border bg-background/40"
		/>
	);
}

function CircuitDiagram({ data }: { data: CircuitData }) {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const dpr = window.devicePixelRatio || 1;
		const rect = canvas.getBoundingClientRect();
		canvas.width = rect.width * dpr;
		canvas.height = rect.height * dpr;
		ctx.scale(dpr, dpr);

		ctx.clearRect(0, 0, rect.width, rect.height);

		const wireColor = "#374151";
		const componentColor = "#6366f1";
		const batteryColor = "#ef4444";

		[80].forEach((x) => {
			ctx.strokeStyle = wireColor;
			ctx.lineWidth = 2;

			ctx.beginPath();
			ctx.moveTo(x, 60);
			ctx.lineTo(x, 180);
			ctx.stroke();

			ctx.beginPath();
			ctx.moveTo(220, 60);
			ctx.lineTo(220, 180);
			ctx.stroke();

			ctx.beginPath();
			ctx.moveTo(x, 60);
			ctx.lineTo(220, 60);
			ctx.stroke();

			ctx.beginPath();
			ctx.moveTo(x, 180);
			ctx.lineTo(220, 180);
			ctx.stroke();

			ctx.fillStyle = batteryColor;
			ctx.fillRect(x, 100, 8, 20);
			ctx.fillStyle = wireColor;
			ctx.fillRect(x + 8, 108, 4, 4);

			if (data.components) {
				data.components.forEach((comp) => {
					if (comp.type === "resistor") {
						ctx.strokeStyle = componentColor;
						ctx.lineWidth = 3;
						ctx.beginPath();
						const rx = comp.x || 200;
						const ry = comp.y || 120;
						ctx.moveTo(rx - 20, ry);
						for (let i = 0; i < 4; i++) {
							ctx.lineTo(rx - 15 + i * 10, ry - 5);
							ctx.lineTo(rx - 10 + i * 10, ry + 5);
						}
						ctx.lineTo(rx + 20, ry);
						ctx.stroke();

						if (comp.label) {
							ctx.fillStyle = "#374151";
							ctx.font = "10px sans-serif";
							ctx.textAlign = "center";
							ctx.fillText(comp.label, rx, ry + 25);
						}
					}

					if (comp.label?.includes("ε") || comp.label?.includes("V")) {
						ctx.fillStyle = "#374151";
						ctx.font = "bold 12px sans-serif";
						ctx.textAlign = "left";
						ctx.fillText(comp.label, x + 20, 95);
					}
				});
			}
		});
	}, [data]);

	return (
		<canvas
			ref={canvasRef}
			className="w-full rounded-2xl border bg-background/40"
		/>
	);
}

function WaveDiagram({ data }: { data: WaveData }) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [phase, setPhase] = useState(0);

	useEffect(() => {
		let animationId: number;
		if (data.showWaves) {
			const animate = () => {
				setPhase((p) => p + 0.1);
				animationId = requestAnimationFrame(animate);
			};
			animationId = requestAnimationFrame(animate);
		}
		return () => cancelAnimationFrame(animationId);
	}, [data.showWaves]);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const dpr = window.devicePixelRatio || 1;
		const rect = canvas.getBoundingClientRect();
		canvas.width = rect.width * dpr;
		canvas.height = rect.height * dpr;
		ctx.scale(dpr, dpr);

		ctx.clearRect(0, 0, rect.width, rect.height);

		if (data.showWaves) {
			const amplitude = 30;
			// const frequency = data.frequency || 400;
			const wavelength = data.waveLength || 50;

			const numWaves = 5;
			for (let w = 0; w < numWaves; w++) {
				ctx.beginPath();
				ctx.strokeStyle = data.sourceMoving ? "#ef4444" : "#3b82f6";
				ctx.lineWidth = 2;

				for (let x = 0; x < rect.width; x++) {
					const y =
						rect.height / 2 +
						amplitude *
							Math.sin(
								((x + phase) * 2 * Math.PI) / wavelength - (w * Math.PI) / 2,
							);
					if (x === 0) ctx.moveTo(x, y);
					else ctx.lineTo(x, y);
				}
				ctx.stroke();
			}

			if (data.sourceMoving) {
				ctx.fillStyle = "#ef4444";
				ctx.beginPath();
				ctx.arc(30 + phase * 0.5, rect.height / 2, 15, 0, Math.PI * 2);
				ctx.fill();
			}

			if (data.waveType === "photon") {
				for (let i = 0; i < 3; i++) {
					const yOffset = (i - 1) * 15;
					ctx.beginPath();
					ctx.strokeStyle = "#fbbf24";
					ctx.lineWidth = 3;
					ctx.setLineDash([5, 5]);
					ctx.moveTo(0, rect.height / 2 + yOffset);
					ctx.lineTo(rect.width, rect.height / 2 + yOffset);
					ctx.stroke();
					ctx.setLineDash([]);
				}
			}
		}
	}, [data, phase]);

	return (
		<canvas
			ref={canvasRef}
			className="w-full rounded-2xl border bg-background/40"
		/>
	);
}

function MotionDiagram({ data }: { data: MotionData }) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
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

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const dpr = window.devicePixelRatio || 1;
		const rect = canvas.getBoundingClientRect();
		canvas.width = rect.width * dpr;
		canvas.height = rect.height * dpr;
		ctx.scale(dpr, dpr);

		ctx.clearRect(0, 0, rect.width, rect.height);

		if (data.objects) {
			data.objects.forEach((obj) => {
				if (obj.type === "rectangle") {
					const x =
						data.motionType === "free-fall"
							? obj.x
							: obj.x + (animationFrame / 100) * 50;
					const y =
						data.motionType === "vertical-up"
							? obj.y - (animationFrame / 100) * 80
							: data.motionType === "free-fall"
								? obj.y + (animationFrame / 100) * 80
								: obj.y;

					ctx.fillStyle = obj.fill;
					ctx.fillRect(x, y, obj.width || 50, obj.height || 30);
					if (obj.label) {
						ctx.fillStyle = "#fff";
						ctx.font = "10px sans-serif";
						ctx.textAlign = "center";
						ctx.fillText(
							obj.label,
							x + (obj.width || 50) / 2,
							y + (obj.height || 30) / 2 + 3,
						);
					}
				} else if (obj.type === "circle") {
					const baseY =
						data.motionType === "vertical-up"
							? obj.y - (animationFrame / 100) * 80
							: data.motionType === "free-fall"
								? obj.y + (animationFrame / 100) * 80
								: obj.y;
					const y =
						data.motionType === "vertical-up"
							? Math.max(40, baseY)
							: data.motionType === "free-fall"
								? Math.min(rect.height - 30, baseY)
								: baseY;

					ctx.beginPath();
					ctx.arc(obj.x, y, obj.radius || 15, 0, Math.PI * 2);
					ctx.fillStyle = obj.fill;
					ctx.fill();
					if (obj.label) {
						ctx.fillStyle = "#fff";
						ctx.font = "10px sans-serif";
						ctx.textAlign = "center";
						ctx.fillText(obj.label, obj.x, y + 3);
					}
				}
			});
		}

		if (data.motionType === "vertical-up" && data.initialVelocity) {
			ctx.fillStyle = "#3b82f6";
			ctx.font = "bold 12px sans-serif";
			ctx.textAlign = "left";
			ctx.fillText(`v₀ = ${data.initialVelocity} m/s`, 20, 30);
			ctx.fillText("↑", 80, 35);
		}

		if (data.trajectory) {
			ctx.beginPath();
			ctx.strokeStyle = "#6366f1";
			ctx.lineWidth = 1;
			ctx.setLineDash([4, 4]);
			ctx.moveTo(150, 180);
			ctx.quadraticCurveTo(150, 40, 150, 40);
			ctx.stroke();
			ctx.setLineDash([]);

			if (data.trajectory.apex) {
				ctx.fillStyle = "#6366f1";
				ctx.beginPath();
				ctx.arc(
					data.trajectory.apex.x,
					data.trajectory.apex.y,
					4,
					0,
					Math.PI * 2,
				);
				ctx.fill();
			}
		}

		if (data.angle) {
			ctx.strokeStyle = "#6b7280";
			ctx.lineWidth = 1;
			ctx.setLineDash([4, 4]);
			ctx.beginPath();
			ctx.moveTo(80, 130);
			ctx.lineTo(180, 130);
			ctx.stroke();
			ctx.setLineDash([]);

			ctx.fillStyle = "#6b7280";
			ctx.font = "italic 11px sans-serif";
			ctx.fillText(`${data.angle}°`, 130, 145);
		}
	}, [data, animationFrame]);

	return (
		<canvas
			ref={canvasRef}
			className="w-full rounded-2xl border bg-background/40"
		/>
	);
}

export function QuestionDiagram({ diagram }: { diagram: QADiagram }) {
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
