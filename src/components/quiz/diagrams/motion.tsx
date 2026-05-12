"use client";

import { useEffect, useMemo, useState } from "react";
import { Circle, Group, Layer, Line, Rect, Stage, Text } from "react-konva";

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

export function MotionDiagram({ data }: { data: MotionData }) {
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
					<Group key={`group-${index}`} x={x} y={y}>
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
								fill="oklch(100% 0 0)"
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
					<Group key={`group-${index}`} x={x} y={y}>
						<Circle radius={obj.radius || 15} fill={obj.fill} />
						{obj.label && (
							<Text
								text={obj.label}
								fill="oklch(100% 0 0)"
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
						fill="oklch(57.7% 0.184 264°)"
						fontSize={12}
						fontStyle="bold"
					/>
					<Text
						text="↑"
						x={80}
						y={35}
						fill="oklch(57.7% 0.184 264°)"
						fontSize={12}
					/>
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
					stroke="oklch(52.5% 0.142 274°)"
					strokeWidth={1}
					dash={[4, 4]}
				/>
				{data.trajectory.apex && (
					<Circle
						x={data.trajectory.apex.x}
						y={data.trajectory.apex.y}
						radius={4}
						fill="oklch(52.5% 0.142 274°)"
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
					stroke="oklch(52.9% 0.012 264°)"
					strokeWidth={1}
					dash={[4, 4]}
				/>
				<Text
					text={`${data.angle}°`}
					x={130}
					y={145}
					fill="oklch(52.9% 0.012 264°)"
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
