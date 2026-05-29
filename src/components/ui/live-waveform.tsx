"use client";

import { type HTMLAttributes, useRef } from "react";
import { useAnimationLoop } from "@/hooks/use-animation-loop";
import { useCanvasResize } from "@/hooks/use-canvas-resize";
import { useMicrophone } from "@/hooks/use-microphone";
import { useProcessingAnimation } from "@/hooks/use-processing-animation";
import { CanvasComponent } from "./live-waveform/canvas-component";

export type LiveWaveformProps = HTMLAttributes<HTMLDivElement> & {
	active?: boolean;
	processing?: boolean;
	deviceId?: string;
	barWidth?: number;
	barHeight?: number;
	barGap?: number;
	barRadius?: number;
	barColor?: string;
	fadeEdges?: boolean;
	fadeWidth?: number;
	height?: string | number;
	sensitivity?: number;
	smoothingTimeConstant?: number;
	fftSize?: number;
	historySize?: number;
	updateRate?: number;
	mode?: "scrolling" | "static";
	onError?: (error: Error) => void;
	onStreamReady?: (stream: MediaStream) => void;
	onStreamEnd?: () => void;
};

export const LiveWaveform = ({
	active = false,
	processing = false,
	deviceId,
	barWidth = 3,
	barGap = 1,
	barRadius = 1.5,
	barColor,
	fadeEdges = true,
	fadeWidth = 24,
	barHeight: baseBarHeight = 4,
	height = 64,
	sensitivity = 1,
	smoothingTimeConstant = 0.8,
	fftSize = 256,
	historySize = 60,
	updateRate = 30,
	mode = "static",
	onError,
	onStreamReady,
	onStreamEnd,
	className,
}: LiveWaveformProps) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const historyRef = useRef<number[]>([]);
	const analyserRef = useRef<AnalyserNode | null>(null);
	const audioContextRef = useRef<AudioContext | null>(null);
	const streamRef = useRef<MediaStream | null>(null);
	const animationRef = useRef<number>(0);
	const lastUpdateRef = useRef<number>(0);
	const processingAnimationRef = useRef<number | null>(null);
	const lastActiveDataRef = useRef<number[]>([]);
	const transitionProgressRef = useRef(0);
	const staticBarsRef = useRef<number[]>([]);
	const needsRedrawRef = useRef(true);
	const gradientCacheRef = useRef<CanvasGradient | null>(null);
	const lastWidthRef = useRef(0);

	const heightStyle = typeof height === "number" ? `${height}px` : height;

	const resizeRefs = {
		canvasRef,
		containerRef,
		gradientCacheRef,
		lastWidthRef,
		needsRedrawRef,
	};
	useCanvasResize(resizeRefs);

	const animRefs = {
		containerRef,
		historyRef,
		processingAnimationRef,
		lastActiveDataRef,
		transitionProgressRef,
		staticBarsRef,
		needsRedrawRef,
	};
	const animValues = { processing, active, barWidth, barGap, mode };
	useProcessingAnimation(animRefs, animValues);

	const micRefs = {
		streamRef,
		audioContextRef,
		animationRef,
		analyserRef,
		historyRef,
	};
	const micValues = {
		active,
		deviceId,
		fftSize,
		smoothingTimeConstant,
		onError,
		onStreamReady,
		onStreamEnd,
	};
	useMicrophone(micRefs, micValues);

	const loopRefs = {
		canvasRef,
		analyserRef,
		historyRef,
		staticBarsRef,
		lastActiveDataRef,
		lastUpdateRef,
		needsRedrawRef,
		gradientCacheRef,
		lastWidthRef,
	};
	const loopValues = {
		active,
		processing,
		sensitivity,
		updateRate,
		historySize,
		barWidth,
		baseBarHeight,
		barGap,
		barRadius,
		barColor,
		fadeEdges,
		fadeWidth,
		mode,
	};
	useAnimationLoop(loopRefs, loopValues);

	return (
		<CanvasComponent
			containerRef={containerRef}
			canvasRef={canvasRef}
			active={active}
			processing={processing}
			heightStyle={heightStyle}
			className={className}
		/>
	);
};
