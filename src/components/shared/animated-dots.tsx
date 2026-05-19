import { m } from "framer-motion";
import { cn } from "@/lib/shared";

interface AnimatedDotsProps {
	count?: number;
	delay?: number;
	className?: string;
	dotClassName?: string;
}

export function AnimatedDots({
	count = 3,
	delay = 150,
	className,
	dotClassName,
}: AnimatedDotsProps) {
	return (
		<div className={cn("flex items-center gap-1.5", className)}>
			{Array.from({ length: count }).map((_, i) => (
				<span
					key={i}
					className={cn(
						"size-1.5 rounded-full bg-muted-foreground/40",
						dotClassName,
					)}
					style={{
						animation: "pulse-dot 1s ease-out infinite",
						animationDelay: `${i * delay}ms`,
					}}
				/>
			))}
		</div>
	);
}

export function AnimatedDotsMotion({
	count = 3,
	delay = 0.15,
	className,
	dotClassName,
}: AnimatedDotsProps) {
	return (
		<div className={cn("flex items-center gap-1.5", className)}>
			{Array.from({ length: count }).map((_, i) => (
				<m.span
					key={i}
					className={cn(
						"size-1.5 rounded-full bg-muted-foreground/40",
						dotClassName,
					)}
					animate={{
						opacity: [0.4, 1, 0.4],
						scale: [1, 1.2, 1],
					}}
					transition={{
						duration: 1,
						repeat: Infinity,
						ease: "easeOut",
						delay: i * delay,
					}}
				/>
			))}
		</div>
	);
}
