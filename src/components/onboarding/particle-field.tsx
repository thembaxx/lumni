"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { memo, useEffect, useMemo, useRef } from "react";
import {
	AdditiveBlending,
	Color,
	type Points,
	type PointsMaterial,
} from "three";

const STEP_COLORS: Record<number, string> = {
	0: "#3d9970",
	1: "#54a884",
	2: "#d4a843",
	3: "#4a8ec4",
	4: "#c45a4a",
};

function parseColor(hex: string) {
	const c = new Color(hex);
	return [c.r, c.g, c.b] as const;
}

const COLORS = {
	0: parseColor(STEP_COLORS[0]),
	1: parseColor(STEP_COLORS[1]),
	2: parseColor(STEP_COLORS[2]),
	3: parseColor(STEP_COLORS[3]),
	4: parseColor(STEP_COLORS[4]),
};

const PARTICLE_COUNT = 200;

interface ParticlesProps {
	step: number;
}

const Particles = memo(function Particles({ step }: ParticlesProps) {
	const meshRef = useRef<Points>(null);
	const positions = useMemo(() => {
		const pos = new Float32Array(PARTICLE_COUNT * 3);
		for (let i = 0; i < PARTICLE_COUNT; i++) {
			pos[i * 3] = (Math.random() - 0.5) * 20;
			pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
			pos[i * 3 + 2] = (Math.random() - 0.5) * 10 - 5;
		}
		return pos;
	}, []);

	const targetColor = useMemo(
		() => COLORS[step as keyof typeof COLORS] ?? COLORS[0],
		[step],
	);
	const currentColorRef = useRef<Color | null>(null);
	if (currentColorRef.current === null) {
		currentColorRef.current = new Color(...COLORS[0]);
	}
	const mouse = useRef({ x: 0, y: 0 });

	useEffect(() => {
		const handleMouse = (e: MouseEvent) => {
			mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
			mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
		};
		window.addEventListener("mousemove", handleMouse);
		return () => window.removeEventListener("mousemove", handleMouse);
	}, []);

	useFrame((state, delta) => {
		if (!meshRef.current) return;
		const material = meshRef.current.material as PointsMaterial;
		const color = currentColorRef.current;
		if (color) {
			color.lerp(new Color(...targetColor), delta * 0.8);
			material.color.copy(color);
		}

		const time = state.clock.elapsedTime;
		const positions2 = meshRef.current.geometry.attributes.position
			.array as Float32Array;
		for (let i = 0; i < PARTICLE_COUNT; i++) {
			const i3 = i * 3;
			const baseX = (i % 20) * 1.0 - 10;
			const baseY = Math.floor(i / 20) * 1.0 - 10;
			positions2[i3] =
				baseX + Math.sin(time * 0.3 + i * 0.1) * 0.8 + mouse.current.x * 0.2;
			positions2[i3 + 1] =
				baseY + Math.cos(time * 0.2 + i * 0.15) * 0.8 + mouse.current.y * 0.2;
			positions2[i3 + 2] = Math.sin(time * 0.1 + i * 0.05) * 0.5;
		}
		meshRef.current.geometry.attributes.position.needsUpdate = true;

		const targetSize = 0.04 + Math.sin(time * 0.5 + step) * 0.015;
		material.size += (targetSize - material.size) * 0.05;
	});

	return (
		<points ref={meshRef}>
			<bufferGeometry>
				<bufferAttribute args={[positions, 3]} attach="attributes-position" />
			</bufferGeometry>
			<pointsMaterial
				size={0.04}
				transparent
				opacity={0.5}
				sizeAttenuation
				depthWrite={false}
				blending={AdditiveBlending}
			/>
		</points>
	);
});

interface ParticleFieldProps {
	step: number;
}

export function ParticleField({ step }: ParticleFieldProps) {
	return (
		<div className="pointer-events-none fixed inset-0 z-0">
			<Canvas
				camera={{ position: [0, 0, 6], fov: 60 }}
				dpr={[1, 1.5]}
				gl={{ antialias: false, alpha: true }}
				style={{ background: "transparent" }}
			>
				<Particles step={step} />
			</Canvas>
		</div>
	);
}
