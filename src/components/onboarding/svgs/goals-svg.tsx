"use client";

import { motion } from "framer-motion";

export function GoalsSVG() {
	return (
		<svg
			viewBox="0 0 240 240"
			fill="none"
			className="h-full w-full"
			preserveAspectRatio="xMidYMid meet"
		>
			<title>Goals</title>
			<motion.g
				initial={{ opacity: 0, scale: 0.9 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ duration: 0.4 }}
			>
				<circle cx="120" cy="120" r="100" className="fill-[--chart-3]/5" />
				<circle cx="120" cy="120" r="70" className="fill-[--chart-3]/4" />
			</motion.g>

			<motion.g
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.4, delay: 0.05 }}
			>
				<circle
					cx="120"
					cy="120"
					r="45"
					className="stroke-[--chart-3]"
					strokeWidth={2}
					opacity={0.3}
					fill="none"
				/>
				<circle
					cx="120"
					cy="120"
					r="32"
					className="stroke-[--chart-3]"
					strokeWidth={2.5}
					opacity={0.45}
					fill="none"
				/>
				<circle
					cx="120"
					cy="120"
					r="19"
					className="stroke-[--chart-3]"
					strokeWidth={3}
					opacity={0.6}
					fill="none"
				/>
				<circle
					cx="120"
					cy="120"
					r="8"
					className="fill-[--chart-3]"
					opacity={0.8}
				/>

				<line
					x1="120"
					y1="60"
					x2="120"
					y2="100"
					className="stroke-[--chart-3]"
					strokeWidth={1.5}
					opacity={0.2}
					strokeDasharray="3 3"
				/>
				<line
					x1="120"
					y1="140"
					x2="120"
					y2="180"
					className="stroke-[--chart-3]"
					strokeWidth={1.5}
					opacity={0.2}
					strokeDasharray="3 3"
				/>
				<line
					x1="60"
					y1="120"
					x2="100"
					y2="120"
					className="stroke-[--chart-3]"
					strokeWidth={1.5}
					opacity={0.2}
					strokeDasharray="3 3"
				/>
				<line
					x1="140"
					y1="120"
					x2="180"
					y2="120"
					className="stroke-[--chart-3]"
					strokeWidth={1.5}
					opacity={0.2}
					strokeDasharray="3 3"
				/>
			</motion.g>

			<motion.g
				initial={{ opacity: 0, y: 8 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.4, delay: 0.1 }}
			>
				<path
					d="M85 130 L115 115 L160 60"
					className="stroke-[--chart-3]"
					strokeWidth={3}
					strokeLinecap="round"
					strokeLinejoin="round"
					fill="none"
				/>
				<polygon points="160,55 168,65 155,68" className="fill-[--chart-3]" />
				<circle cx="85" cy="130" r="4" className="fill-[--chart-3]" />
			</motion.g>
		</svg>
	);
}
