"use client";

import { motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";

interface MagneticWrapperProps {
	children: React.ReactNode;
	className?: string;
	stiffness?: number;
	damping?: number;
}

export function Magnetic({
	children,
	className,
	stiffness = 150,
	damping = 20,
}: MagneticWrapperProps) {
	const ref = useRef<HTMLDivElement>(null);
	const x = useMotionValue(0);
	const y = useMotionValue(0);

	const rotateX = useTransform(y, [-8, 8], [4, -4]);
	const rotateY = useTransform(x, [-8, 8], [-4, 4]);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;

		const handleMouseMove = (e: MouseEvent) => {
			const rect = el.getBoundingClientRect();
			const centerX = rect.left + rect.width / 2;
			const centerY = rect.top + rect.height / 2;
			const clientX = e.clientX - centerX;
			const clientY = e.clientY - centerY;
			x.set(clientX / 4);
			y.set(clientY / 4);
		};

		const handleMouseLeave = () => {
			x.set(0);
			y.set(0);
		};

		el.addEventListener("mousemove", handleMouseMove);
		el.addEventListener("mouseleave", handleMouseLeave);
		return () => {
			el.removeEventListener("mousemove", handleMouseMove);
			el.removeEventListener("mouseleave", handleMouseLeave);
		};
	}, [x, y]);

	return (
		<motion.div
			ref={ref}
			className={className}
			style={{ perspective: 400, x, y, rotateX, rotateY }}
		>
			{children}
		</motion.div>
	);
}