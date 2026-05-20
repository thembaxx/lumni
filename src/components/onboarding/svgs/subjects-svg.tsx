"use client";

import { m } from "framer-motion";

export function SubjectsSVG() {
	return (
		<svg
			viewBox="0 0 240 240"
			fill="none"
			className="h-full w-full"
			preserveAspectRatio="xMidYMid meet"
		>
			<title>Subjects</title>
			<m.g
				initial={{ opacity: 0, scale: 0.9 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ duration: 0.4 }}
			>
				<circle cx="120" cy="110" r="90" className="fill-[--chart-2]/5" />
				<ellipse
					cx="120"
					cy="130"
					rx="60"
					ry="20"
					className="fill-[--chart-2]/8"
				/>
			</m.g>

			<m.g
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.4, delay: 0.05 }}
			>
				{[6, 8, 10].map((w, i) => {
					const x = 110 - w / 2 + i * 12;
					const y = 85 - i * 4;
					const hues = ["var(--chart-2)", "var(--chart-3)", "var(--chart-4)"];
					return (
						// biome-ignore lint/suspicious/noArrayIndexKey: static SVG array
						<g key={i}>
							<rect
								x={x}
								y={y}
								width={w}
								height={45 + i * 5}
								rx={3}
								fill={hues[i]}
								opacity={0.7 - i * 0.1}
							/>
							<line
								x1={x + 3}
								y1={y + 10}
								x2={x + w - 3}
								y2={y + 10}
								className="stroke-white"
								strokeWidth={1.5}
								opacity={0.4}
							/>
							<line
								x1={x + 3}
								y1={y + 16}
								x2={x + w - 3}
								y2={y + 16}
								className="stroke-white"
								strokeWidth={1}
								opacity={0.3}
							/>
							<line
								x1={x + 3}
								y1={y + 20}
								x2={x + w - 3}
								y2={y + 20}
								className="stroke-white"
								strokeWidth={1}
								opacity={0.3}
							/>
						</g>
					);
				})}
			</m.g>

			<m.g
				initial={{ opacity: 0, y: 8 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.4, delay: 0.1 }}
			>
				{[
					[30, 70, 1],
					[200, 50, 0.7],
					[30, 150, 0.5],
					[190, 160, 0.8],
				].map(([x, y, s], i) => (
					<rect
						// biome-ignore lint/suspicious/noArrayIndexKey: static SVG array
						key={i}
						x={x}
						y={y}
						width={12 * (s as number)}
						height={8 * (s as number)}
						rx={2}
						className="fill-[--chart-2]"
						opacity={0.2}
						transform={`rotate(${i * 30 + 10} ${x + 6} ${y + 4})`}
					/>
				))}
			</m.g>
		</svg>
	);
}
