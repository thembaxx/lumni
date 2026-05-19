"use client";

import { motion } from "framer-motion";

export function ScheduleSVG() {
	return (
		<svg
			viewBox="0 0 240 240"
			fill="none"
			className="h-full w-full"
			preserveAspectRatio="xMidYMid meet"
		>
			<motion.g
				initial={{ opacity: 0, scale: 0.9 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ duration: 0.4 }}
			>
				<circle cx="120" cy="120" r="100" className="fill-[--chart-4]/5" />
				<circle cx="120" cy="120" r="78" className="fill-[--chart-4]/4" />
			</motion.g>

			<motion.g
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.4, delay: 0.05 }}
			>
				<circle
					cx="120"
					cy="120"
					r="50"
					className="stroke-[--chart-4]"
					strokeWidth={2.5}
					opacity={0.3}
					fill="none"
				/>
				<circle
					cx="120"
					cy="120"
					r="35"
					className="stroke-[--chart-4]"
					strokeWidth={1.5}
					opacity={0.15}
					fill="none"
					strokeDasharray="4 4"
				/>

				{[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
					const rad = (angle * Math.PI) / 180;
					const x = 120 + 50 * Math.cos(rad);
					const y = 120 + 50 * Math.sin(rad);
					return (
						<circle
							key={i}
							cx={x}
							cy={y}
							r={3 + (i % 2)}
							className="fill-[--chart-4]"
							opacity={0.2 + i * 0.06}
						>
							<animate
								attributeName="opacity"
								values={`${0.2 + i * 0.06};${0.6};${0.2 + i * 0.06}`}
								dur={`${3 + i * 0.3}s`}
								repeatCount="indefinite"
							/>
						</circle>
					);
				})}
			</motion.g>

			<motion.g
				initial={{ opacity: 0, y: 8 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.4, delay: 0.1 }}
			>
				<circle
					cx="120"
					cy="120"
					r="28"
					className="fill-[--chart-4]"
					opacity={0.1}
				/>

				<line
					x1="120"
					y1="120"
					x2="120"
					y2="98"
					className="stroke-[--chart-4]"
					strokeWidth={3}
					strokeLinecap="round"
					opacity={0.8}
				>
					<animateTransform
						attributeName="transform"
						type="rotate"
						from="0 120 120"
						to="360 120 120"
						dur="12s"
						repeatCount="indefinite"
					/>
				</line>

				<line
					x1="120"
					y1="120"
					x2="140"
					y2="135"
					className="stroke-[--chart-4]"
					strokeWidth={2.5}
					strokeLinecap="round"
					opacity={0.6}
				>
					<animateTransform
						attributeName="transform"
						type="rotate"
						from="0 120 120"
						to="360 120 120"
						dur="2s"
						repeatCount="indefinite"
					/>
				</line>

				<circle
					cx="120"
					cy="120"
					r="3"
					className="fill-[--chart-4]"
					opacity={0.9}
				/>
			</motion.g>
		</svg>
	);
}
