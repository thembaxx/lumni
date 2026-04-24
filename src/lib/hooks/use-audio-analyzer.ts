import { useCallback, useRef } from "react";

export interface UseAudioAnalyzerOptions {
	active: boolean;
	deviceId?: string;
	fftSize?: number;
	smoothingTimeConstant?: number;
	onError?: (error: Error) => void;
	onStreamReady?: (stream: MediaStream) => void;
	onStreamEnd?: () => void;
}

export interface UseAudioAnalyzerReturn {
	analyserRef: React.MutableRefObject<AnalyserNode | null>;
	streamRef: React.MutableRefObject<MediaStream | null>;
	updateAudioData: (dataArray: Uint8Array) => void;
}

export function useAudioAnalyzer({
	active,
	deviceId,
	fftSize = 256,
	smoothingTimeConstant = 0.8,
	onError,
	onStreamReady,
	onStreamEnd,
}: UseAudioAnalyzerOptions) {
	const analyserRef = useRef<AnalyserNode | null>(null);
	const audioContextRef = useRef<AudioContext | null>(null);
	const streamRef = useRef<MediaStream | null>(null);
	const animationRef = useRef<number>(0);

	const setupMicrophone = useCallback(async () => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				audio: deviceId
					? {
							deviceId: { exact: deviceId },
							echoCancellation: true,
							noiseSuppression: true,
							autoGainControl: true,
						}
					: {
							echoCancellation: true,
							noiseSuppression: true,
							autoGainControl: true,
						},
			});
			streamRef.current = stream;
			onStreamReady?.(stream);

			const AudioContextConstructor =
				window.AudioContext ||
				(window as unknown as { webkitAudioContext: typeof AudioContext })
					.webkitAudioContext;
			const audioContext = new AudioContextConstructor();
			const analyser = audioContext.createAnalyser();
			analyser.fftSize = fftSize;
			analyser.smoothingTimeConstant = smoothingTimeConstant;

			const source = audioContext.createMediaStreamSource(stream);
			source.connect(analyser);

			audioContextRef.current = audioContext;
			analyserRef.current = analyser;

			return true;
		} catch (error) {
			onError?.(error as Error);
			return false;
		}
	}, [deviceId, fftSize, smoothingTimeConstant, onError, onStreamReady]);

	const cleanup = useCallback(() => {
		if (streamRef.current) {
			streamRef.current.getTracks().forEach((track) => track.stop());
			streamRef.current = null;
			onStreamEnd?.();
		}
		if (audioContextRef.current && audioContextRef.current.state !== "closed") {
			audioContextRef.current.close();
			audioContextRef.current = null;
		}
		if (animationRef.current) {
			cancelAnimationFrame(animationRef.current);
			animationRef.current = 0;
		}
	}, [onStreamEnd]);

	const updateAudioData = useCallback((dataArray: Uint8Array<ArrayBuffer>) => {
		if (analyserRef.current) {
			analyserRef.current.getByteFrequencyData(dataArray);
		}
	}, []);

	return {
		analyserRef,
		streamRef,
		audioContextRef,
		animationRef,
		setupMicrophone,
		cleanup,
		updateAudioData,
	};
}
