"use client";

import { m, useSpring, useTransform } from "framer-motion";
import { memo, useEffect, useState } from "react";
import {
	elementCategoryConfig,
	elementEaseOutQuint,
} from "@/lib/data/element-categories";
import type { Element } from "@/lib/data/elements";

const getBg = (category: string) =>
	elementCategoryConfig[category]?.bg || "bg-gray-500/90";

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
		const glowIntensity = useSpring(0, { stiffness: 300, damping: 25 });

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
				`0 0 12px oklch(${elementCategoryConfig[el.category]?.rgb} / 0.4)`,
				`0 0 24px oklch(${elementCategoryConfig[el.category]?.rgb} / 0.8), 0 0 48px oklch(${elementCategoryConfig[el.category]?.rgb} / 0.4)`,
			],
		);

		const symbolScale = useTransform(glowIntensity, [0, 1], [1, 1.05]);

		return (
			<m.button
				onClick={() => onClick(el.atomicNumber)}
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
				className={`relative flex flex-col items-center justify-center ${getBg(el.category)}rounded-2xl aspect-square cursor-pointer border border-white/10 p-2 dark:border-white/20`}
			>
				<span className="ios-caption-3 absolute top-1.5 left-2 font-extrabold tabular-nums opacity-50">
					{el.atomicNumber}
				</span>
				<m.span
					style={{ scale: symbolScale }}
					className="font-extrabold text-white text-xl drop-shadow-lg"
				>
					{el.symbol}
				</m.span>
				<span className="ios-caption-3 mt-0.5 text-center leading-tight opacity-60">
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
