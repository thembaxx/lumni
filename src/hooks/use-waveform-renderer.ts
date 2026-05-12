import { useCallback, useRef } from "react";

export interface UseWaveformRendererOptions {
	active: boolean;
	processing: boolean;
	barWidth: number;
	barGap: number;
	barRadius: number;
	barColor?: string;
	baseBarHeight: number;
	fadeEdges: boolean;
	fadeWidth: number;
	sensitivity: number;
	updateRate: number;
	historySize: number;
	mode: "scrolling" | "static";
}

export interface UseWaveformRendererReturn {
	canvasRef: React.RefObject<HTMLCanvasElement | null>;
	containerRef: React.RefObject<HTMLDivElement | null>;
	historyRef: React.MutableRefObject<number[]>;
	staticBarsRef: React.MutableRefObject<number[]>;
	lastActiveDataRef: React.MutableRefObject<number[]>;
	setupCanvasResize: () => (() => void) | undefined;
	startAnimationLoop: () => void;
	stopAnimationLoop: () => void;
}

export function useWaveformRenderer({
	active,
	processing,
	barWidth,
	barGap,
	barRadius,
	barColor,
	baseBarHeight,
	fadeEdges,
	fadeWidth,
	sensitivity,
	updateRate,
	historySize,
	mode,
}: UseWaveformRendererOptions): UseWaveformRendererReturn {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const historyRef = useRef<number[]>([]);
	const staticBarsRef = useRef<number[]>([]);
	const lastActiveDataRef = useRef<number[]>([]);
	const lastUpdateRef = useRef(0);
	const needsRedrawRef = useRef(true);
	const gradientCacheRef = useRef<CanvasGradient | null>(null);
	const lastWidthRef = useRef(0);
	const rafIdRef = useRef<number>(0);

	const setupCanvasResize = useCallback(() => {
		const canvas = canvasRef.current;
		const container = containerRef.current;
		if (!canvas || !container) return;

		const resizeObserver = new ResizeObserver(() => {
			const rect = container.getBoundingClientRect();
			const dpr = window.devicePixelRatio || 1;

			canvas.width = rect.width * dpr;
			canvas.height = rect.height * dpr;
			canvas.style.width = `${rect.width}px`;
			canvas.style.height = `${rect.height}px`;

			const ctx = canvas.getContext("2d");
			if (ctx) {
				ctx.scale(dpr, dpr);
			}

			gradientCacheRef.current = null;
			lastWidthRef.current = rect.width;
			needsRedrawRef.current = true;
		});

		resizeObserver.observe(container);
		return () => resizeObserver.disconnect();
	}, []);

	const renderFrame = useCallback(
		(currentTime: number) => {
			const canvas = canvasRef.current;
			if (!canvas) return;

			const ctx = canvas.getContext("2d");
			if (!ctx) return;

			const rect = canvas.getBoundingClientRect();

			// Update audio data if active
			if (active && currentTime - lastUpdateRef.current > updateRate) {
				lastUpdateRef.current = currentTime;
				needsRedrawRef.current = true;
			}

			// Only redraw if needed
			if (!needsRedrawRef.current && !active) {
				rafIdRef.current = requestAnimationFrame(renderFrame);
				return;
			}

			needsRedrawRef.current = active;
			ctx.clearRect(0, 0, rect.width, rect.height);

			const computedBarColor =
				barColor ||
				(() => {
					const style = getComputedStyle(canvas);
					return style.color || "oklch(0% 0 0)";
				})();

			const step = barWidth + barGap;
			const barCount = Math.floor(rect.width / step);
			const centerY = rect.height / 2;

			// Draw bars based on mode
			if (mode === "static") {
				const dataToRender = processing
					? staticBarsRef.current
					: active
						? staticBarsRef.current
						: staticBarsRef.current.length > 0
							? staticBarsRef.current
							: [];

				for (let i = 0; i < barCount && i < dataToRender.length; i++) {
					const value = dataToRender[i] || 0.1;
					const x = i * step;
					const barHeight = Math.max(baseBarHeight, value * rect.height * 0.8);
					const y = centerY - barHeight / 2;

					ctx.fillStyle = computedBarColor;
					ctx.globalAlpha = 0.4 + value * 0.6;

					if (barRadius > 0) {
						ctx.beginPath();
						ctx.roundRect(x, y, barWidth, barHeight, barRadius);
						ctx.fill();
					} else {
						ctx.fillRect(x, y, barWidth, barHeight);
					}
				}
			} else {
				for (let i = 0; i < barCount && i < historyRef.current.length; i++) {
					const dataIndex = historyRef.current.length - 1 - i;
					const value = historyRef.current[dataIndex] || 0.1;
					const x = rect.width - (i + 1) * step;
					const barHeight = Math.max(baseBarHeight, value * rect.height * 0.8);
					const y = centerY - barHeight / 2;

					ctx.fillStyle = computedBarColor;
					ctx.globalAlpha = 0.4 + value * 0.6;

					if (barRadius > 0) {
						ctx.beginPath();
						ctx.roundRect(x, y, barWidth, barHeight, barRadius);
						ctx.fill();
					} else {
						ctx.fillRect(x, y, barWidth, barHeight);
					}
				}
			}

			// Apply edge fading
			if (fadeEdges && fadeWidth > 0 && rect.width > 0) {
				if (!gradientCacheRef.current || lastWidthRef.current !== rect.width) {
					const gradient = ctx.createLinearGradient(0, 0, rect.width, 0);
					const fadePercent = Math.min(0.3, fadeWidth / rect.width);

					gradient.addColorStop(0, "oklch(100% 0 0 / 1)");
					gradient.addColorStop(fadePercent, "oklch(100% 0 0 / 0)");
					gradient.addColorStop(1 - fadePercent, "oklch(100% 0 0 / 0)");
					gradient.addColorStop(1, "oklch(100% 0 0 / 1)");

					gradientCacheRef.current = gradient;
					lastWidthRef.current = rect.width;
				}

				ctx.globalCompositeOperation = "destination-out";
				ctx.fillStyle = gradientCacheRef.current;
				ctx.fillRect(0, 0, rect.width, rect.height);
				ctx.globalCompositeOperation = "source-over";
			}

			ctx.globalAlpha = 1;

			rafIdRef.current = requestAnimationFrame(renderFrame);
		},
		[
			active,
			processing,
			barWidth,
			barGap,
			barRadius,
			barColor,
			baseBarHeight,
			fadeEdges,
			fadeWidth,
			updateRate,
			mode,
		],
	);

	const startAnimationLoop = useCallback(() => {
		rafIdRef.current = requestAnimationFrame(renderFrame);
	}, [renderFrame]);

	const stopAnimationLoop = useCallback(() => {
		if (rafIdRef.current) {
			cancelAnimationFrame(rafIdRef.current);
		}
	}, []);

	return {
		canvasRef,
		containerRef,
		historyRef,
		staticBarsRef,
		lastActiveDataRef,
		setupCanvasResize,
		startAnimationLoop,
		stopAnimationLoop,
	};
}
