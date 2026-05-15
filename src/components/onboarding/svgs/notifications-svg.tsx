"use client";

import { motion } from "framer-motion";

export function NotificationsSVG() {
	return (
		<svg
			viewBox="0 0 240 240"
			fill="none"
			className="w-full h-full"
			preserveAspectRatio="xMidYMid meet"
		>
			<motion.g
				initial={{ opacity: 0, scale: 0.9 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ duration: 0.4 }}
			>
				<circle cx="120" cy="110" r="95" className="fill-[--chart-5]/5" />
				<ellipse cx="120" cy="140" rx="65" ry="20" className="fill-[--chart-5]/4" />
			</motion.g>

			<motion.g
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.4, delay: 0.05 }}
			>
				<circle cx="120" cy="60" r="45" className="stroke-[--chart-5]" strokeWidth={1.5} opacity={0.12} fill="none">
					<animate
						attributeName="r"
						values="45;60;45"
						dur="3s"
						repeatCount="indefinite"
					/>
					<animate
						attributeName="opacity"
						values="0.12;0;0.12"
						dur="3s"
						repeatCount="indefinite"
					/>
				</circle>
				<circle cx="120" cy="60" r="45" className="stroke-[--chart-5]" strokeWidth={1.5} opacity={0.08} fill="none">
					<animate
						attributeName="r"
						values="45;68;45"
						dur="3s"
						begin="0.5s"
						repeatCount="indefinite"
					/>
					<animate
						attributeName="opacity"
						values="0.08;0;0.08"
						dur="3s"
						begin="0.5s"
						repeatCount="indefinite"
					/>
				</circle>
			</motion.g>

			<motion.g
				initial={{ opacity: 0, y: 8 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.4, delay: 0.1 }}
			>
				<path
					d="M120 35 C100 35 88 50 88 68 L88 80 C88 84 84 88 80 92 L160 92 C156 88 152 84 152 80 L152 68 C152 50 140 35 120 35Z"
					className="fill-[--chart-5]"
					opacity={0.7}
				/>
				<path
					d="M104 94 C104 100 112 108 120 108 C128 108 136 100 136 94"
					className="fill-[--chart-5]"
					opacity={0.8}
				/>
				<circle cx="120" cy="52" r="4" className="fill-white" opacity={0.5}>
					<animate
						attributeName="opacity"
						values="0.5;0.8;0.5"
						dur="2s"
						repeatCount="indefinite"
					/>
				</circle>
			</motion.g>
		</svg>
	);
}
