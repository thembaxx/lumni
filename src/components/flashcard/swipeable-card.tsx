"use client";

import { animate, m, useMotionValue, useTransform } from "framer-motion";
import { useState } from "react";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { TTSButton } from "@/components/shared/tts-button";
import { cn } from "@/lib/shared";
import { iOSEase, springTransition } from "@/lib/utils/animation";

interface SwipeableCardProps {
	id: string;
	front: string;
	back: string;
	topic?: string;
	difficulty?: string;
	hint?: string;
	subject?: string;
	isTop: boolean;
	mode: "simple" | "sm2";
	onSwipe: (direction: "left" | "right") => void;
	style?: React.CSSProperties;
}

export function SwipeableCard({
	id: _id,
	front,
	back,
	topic,
	difficulty,
	hint,
	subject,
	isTop,
	mode: _mode,
	onSwipe,
	style,
}: SwipeableCardProps) {
	const [isFlipped, setIsFlipped] = useState(false);
	const x = useMotionValue(0);

	const rotate = useTransform(x, [-300, 0, 300], [-15, 0, 15]);
	const opacity = useTransform(x, [-200, 0, 200], [0.85, 1, 0.85]);
	const background = useTransform(
		x,
		[-200, -100, 0, 100, 200],
		[
			"linear-gradient(135deg, rgba(239,68,68,0.15) 0%, transparent 100%)",
			"linear-gradient(135deg, rgba(239,68,68,0.08) 0%, transparent 100%)",
			"transparent",
			"linear-gradient(135deg, rgba(34,197,94,0.08) 0%, transparent 100%)",
			"linear-gradient(135deg, rgba(34,197,94,0.15) 0%, transparent 100%)",
		],
	);

	function handleDragEnd(
		_event: MouseEvent | TouchEvent | PointerEvent,
		info: { offset: { x: number }; velocity: { x: number } },
	) {
		const threshold = 100;
		const xOffset = info.offset.x;
		const xVelocity = info.velocity.x;

		if (Math.abs(xOffset) > threshold || Math.abs(xVelocity) > 500) {
			const direction = xOffset > 0 || xVelocity > 0 ? "right" : "left";
			const targetX = direction === "right" ? 600 : -600;

			animate(x, targetX, {
				...springTransition,
				onComplete: () => {
					onSwipe(direction);
					x.set(0);
				},
			});
		} else {
			animate(x, 0, { type: "spring", stiffness: 300, damping: 25 });
		}
	}

	function handleTap() {
		if (isTop) {
			setIsFlipped((prev) => !prev);
		}
	}

	function handleKeyDown(e: React.KeyboardEvent) {
		if (!isTop) return;
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			handleTap();
		} else if (e.key === "ArrowLeft") {
			e.preventDefault();
			onSwipe("left");
		} else if (e.key === "ArrowRight") {
			e.preventDefault();
			onSwipe("right");
		}
	}

	return (
		<m.div
			className={cn(
				"absolute inset-0",
				isTop ? "z-10" : "pointer-events-none z-0",
			)}
			style={{ ...style, x, rotate, opacity }}
			drag={isTop ? "x" : false}
			dragConstraints={{ left: 0, right: 0 }}
			dragElastic={0.7}
			onDragEnd={isTop ? handleDragEnd : undefined}
			onTap={isTop ? handleTap : undefined}
			whileDrag={{
				scale: 1.02,
				cursor: "grabbing",
				transition: { duration: 0.1 },
			}}
			whileTap={{ cursor: "grabbing" }}
			layout
			tabIndex={isTop ? 0 : -1}
			role="button"
			aria-label={`Flashcard: ${front}`}
			onKeyDown={isTop ? handleKeyDown : undefined}
		>
			<m.div
				className="perspective-1000 relative h-full w-full"
				style={{ transformStyle: "preserve-3d" }}
			>
				<m.div
					className="relative h-full w-full"
					style={{ transformStyle: "preserve-3d" }}
					animate={{ rotateY: isFlipped ? 180 : 0 }}
					transition={{ duration: 0.5, ease: iOSEase }}
				>
					{/* Front */}
					<div
						className="backface-hidden absolute inset-0 flex flex-col rounded-card-lg border border-border/80 bg-card p-6 shadow-level-2"
						style={{ backfaceVisibility: "hidden" }}
					>
						{isTop && (
							<m.div
								className="pointer-events-none absolute inset-0 rounded-card-lg"
								style={{ background }}
							/>
						)}

						<div className="mb-4 flex items-center gap-2">
							{topic && (
								<span className="rounded-md bg-[--system-accent]/10 px-2 py-0.5 font-medium text-[--system-accent] text-[11px]">
									{topic}
								</span>
							)}
							{difficulty && (
								<span className="rounded-md bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
									{difficulty}
								</span>
							)}
							<div className="ml-auto">
								<TTSButton text={front} />
							</div>
						</div>

						<div className="flex flex-1 items-center justify-center">
							<div className="text-center font-medium text-lg">
								<MarkdownRenderer content={front} subject={subject} />
							</div>
						</div>

						{isTop && !isFlipped && (
							<div className="mt-4 text-center">
								<p className="text-muted-foreground text-xs">
									Tap or press Space/Enter to flip
								</p>
							</div>
						)}
					</div>

					{/* Back */}
					<div
						className="backface-hidden absolute inset-0 flex flex-col rounded-card-lg border border-border/80 bg-card p-6 shadow-level-2"
						style={{
							transform: "rotateY(180deg)",
							backfaceVisibility: "hidden",
						}}
					>
						<div className="mb-2 flex items-center justify-end">
							<TTSButton text={back} />
						</div>

						<div className="flex flex-1 items-center justify-center">
							<div className="text-center">
								<MarkdownRenderer content={back} subject={subject} />
							</div>
						</div>

						{hint && (
							<div className="mt-4 rounded-lg bg-warning/10 p-3 dark:bg-warning/20">
								<p className="text-amber-700 text-xs dark:text-amber-300">
									Hint: {hint}
								</p>
							</div>
						)}

						{isTop && isFlipped && (
							<div className="mt-4 text-center">
								<p className="text-muted-foreground text-xs">
									Swipe right if correct, left if incorrect. Arrow keys or
									Space/Enter to flip.
								</p>
							</div>
						)}
					</div>
				</m.div>
			</m.div>
		</m.div>
	);
}
