"use client";

import { cn } from "@/lib/utils";

interface CanvasComponentProps {
	containerRef: React.RefObject<HTMLDivElement | null>;
	canvasRef: React.RefObject<HTMLCanvasElement | null>;
	active: boolean;
	processing: boolean;
	heightStyle: string;
	className?: string;
}

export function CanvasComponent({
	containerRef,
	canvasRef,
	active,
	processing,
	heightStyle,
	className,
}: CanvasComponentProps) {
	const label = active
		? "Live audio waveform"
		: processing
			? "Processing audio"
			: "Audio waveform idle";

	return (
		<div
			className={cn("relative h-full w-full", className)}
			ref={containerRef}
			style={{ height: heightStyle }}
			aria-label={label}
			role="img"
		>
			{!active && !processing && (
				<div className="absolute top-1/2 right-0 left-0 -translate-y-1/2 border-muted-foreground/20 border-t-2 border-dotted" />
			)}
			<canvas className="block h-full w-full" ref={canvasRef} />
		</div>
	);
}
