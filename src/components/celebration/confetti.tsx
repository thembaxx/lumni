"use client";

import { m } from "framer-motion";
import { useEffect, useState } from "react";

interface ConfettiPiece {
	id: number;
	x: number;
	color: string;
	rotation: number;
	scale: number;
	delay: number;
	borderRadiusType: "round" | "square";
	xOffset: number;
}

const CONFETTI_COLORS = [
	"oklch(64.8% 0.173 142°)",
	"oklch(78.6% 0.156 80°)",
	"oklch(69.6% 0.196 49°)",
	"oklch(62.2% 0.195 348°)",
	"oklch(57.7% 0.184 264°)",
	"oklch(53.5% 0.182 286°)",
	"oklch(66.4% 0.125 186°)",
	"oklch(58.1% 0.226 14°)",
];

export function Confetti({
	trigger,
	count = 50,
	duration = 2000,
}: {
	trigger: boolean;
	count?: number;
	duration?: number;
}) {
	const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

	useEffect(() => {
		if (!trigger) return;
		const newPieces = Array.from({ length: count }, (_, i) => ({
			id: i,
			x: Math.random() * 100,
			color:
				CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
			rotation: Math.random() * 360,
			scale: Math.random() * 0.5 + 0.5,
			delay: Math.random() * 0.3,
			borderRadiusType: (Math.random() > 0.5 ? "round" : "square") as
				| "round"
				| "square",
			xOffset: (Math.random() - 0.5) * 30,
		}));
		setPieces(newPieces);
	}, [trigger, count]);

	useEffect(() => {
		if (pieces.length === 0) return;
		const timeoutId = setTimeout(() => setPieces([]), duration);
		return () => clearTimeout(timeoutId);
	}, [pieces, duration]);

	if (pieces.length === 0) return null;

	return (
		<div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
			{pieces.map((piece) => (
				<m.div
					key={piece.id}
					className="absolute size-3"
					style={{
						left: `${piece.x}%`,
						top: "-20px",
						backgroundColor: piece.color,
						borderRadius: piece.borderRadiusType === "round" ? "50%" : "2px",
						rotate: piece.rotation,
						transform: `scale(${piece.scale})`,
					}}
					initial={{ y: 0, opacity: 1 }}
					animate={{
						y: typeof window !== "undefined" ? window.innerHeight + 100 : 800,
						opacity: 0,
						rotate: piece.rotation + 720,
						x: piece.x + piece.xOffset,
					}}
					transition={{
						duration: duration / 1000,
						delay: piece.delay,
						ease: "linear",
					}}
				/>
			))}
		</div>
	);
}
