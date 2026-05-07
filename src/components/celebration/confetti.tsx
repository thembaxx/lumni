"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface ConfettiPiece {
	id: number;
	x: number;
	color: string;
	rotation: number;
	scale: number;
	delay: number;
}

const CONFETTI_COLORS = [
	"#22c55e",
	"#eab308",
	"#f97316",
	"#ec4899",
	"#3b82f6",
	"#8b5cf6",
	"#14b8a6",
	"#f43f5e",
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
		if (trigger) {
			const newPieces = Array.from({ length: count }, (_, i) => ({
				id: i,
				x: Math.random() * 100,
				color:
					CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
				rotation: Math.random() * 360,
				scale: Math.random() * 0.5 + 0.5,
				delay: Math.random() * 0.3,
			}));
			setPieces(newPieces);
			setTimeout(() => setPieces([]), duration);
		}
	}, [trigger, count, duration]);

	if (pieces.length === 0) return null;

	return (
		<div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
			{pieces.map((piece) => (
				<motion.div
					key={piece.id}
					className="absolute w-3 h-3"
					style={{
						left: `${piece.x}%`,
						top: "-20px",
						backgroundColor: piece.color,
						borderRadius: Math.random() > 0.5 ? "50%" : "2px",
						rotate: piece.rotation,
						transform: `scale(${piece.scale})`,
					}}
					initial={{ y: 0, opacity: 1 }}
					animate={{
						y: window.innerHeight + 100,
						opacity: 0,
						rotate: piece.rotation + 720,
						x: piece.x + (Math.random() - 0.5) * 30,
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
