"use client";

import { useSpring, useTransform } from "motion/react";
import * as m from "motion/react-m";
import { memo, useEffect, useState } from "react";
import {
	elementCategoryConfig,
	elementEaseOutQuint,
} from "@/lib/data/element-categories";
import type { Element } from "@/lib/data/elements";

export const ElementCard = memo(
	({
		el,
		isActive,
		onClick,
	}: {
		el: Element;
		isActive: boolean;
		onClick: (atomicNumber: number) => void;
	}) => {
		const [isHovered, setIsHovered] = useState(false);
		const scale = useSpring(1, { stiffness: 400, damping: 30 });
		const glowIntensity = useSpring(0, { stiffness: 300, damping: 26 });

		const config = elementCategoryConfig[el.category];

		useEffect(() => {
			if (isHovered && isActive) {
				glowIntensity.set(1);
			} else {
				glowIntensity.set(0);
			}
		}, [isHovered, isActive, glowIntensity]);

		const boxShadow = useTransform(
			glowIntensity,
			[0, 1],
			[
				`0 0 12px oklch(${config?.rgb} / 0.4)`,
				`0 0 24px oklch(${config?.rgb} / 0.8), 0 0 48px oklch(${config?.rgb} / 0.4)`,
			],
		);

		const symbolScale = useTransform(glowIntensity, [0, 1], [1, 1.05]);

		return (
			<m.button
				onClick={() => onClick(el.atomicNumber)}
				aria-label={`Select element ${el.name}`}
				onHoverStart={() => setIsHovered(true)}
				onHoverEnd={() => setIsHovered(false)}
				style={{ scale, boxShadow }}
				initial={{ opacity: 0, scale: 0.8, y: 10 }}
				animate={{
					opacity: isActive ? 1 : 0.15,
					scale: 1,
					y: 0,
				}}
				transition={{
					duration: 0.35,
					delay: (el.atomicNumber % 20) * 0.015,
					ease: elementEaseOutQuint,
				}}
				whileTap={isActive ? { scale: 0.95 } : {}}
				className={`${config?.bg} relative flex aspect-square cursor-pointer flex-col items-center justify-center rounded-2xl border border-white/10 p-2 text-white dark:border-white/20`}
			>
				<span className="ios-caption-3 absolute top-1.5 left-2 font-extrabold tabular-nums opacity-50">
					{el.atomicNumber}
				</span>
				<m.span
					style={{ scale: symbolScale }}
					className="font-extrabold text-xl drop-shadow-lg"
				>
					{el.symbol}
				</m.span>
				<span className="ios-caption-3 mt-0.5 text-center leading-tight opacity-70">
					{el.name}
				</span>
				<div
					className="pointer-events-none absolute inset-0 rounded-2xl"
					style={{
						background:
							"radial-gradient(circle at 50% 0%, oklch(100% 0 0 / 0.12) 0%, transparent 50%)",
					}}
				/>
			</m.button>
		);
	},
);
