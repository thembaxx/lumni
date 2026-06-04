import { useEffect } from "react";
import { logError } from "@/lib/shared/logger";

interface MicrophoneRefs {
	streamRef: React.MutableRefObject<MediaStream | null>;
	audioContextRef: React.MutableRefObject<AudioContext | null>;
	animationRef: React.MutableRefObject<number>;
	analyserRef: React.MutableRefObject<AnalyserNode | null>;
	historyRef: React.MutableRefObject<number[]>;
}

interface MicrophoneValues {
	active: boolean;
	deviceId?: string;
	fftSize: number;
	smoothingTimeConstant: number;
	onError?: (error: Error) => void;
	onStreamReady?: (stream: MediaStream) => void;
	onStreamEnd?: () => void;
}

export function useMicrophone(refs: MicrophoneRefs, values: MicrophoneValues) {
	const { streamRef, audioContextRef, animationRef, analyserRef, historyRef } =
		refs;
	const {
		active,
		deviceId,
		fftSize,
		smoothingTimeConstant,
		onError,
		onStreamReady,
		onStreamEnd,
	} = values;

	useEffect(() => {
		if (!active) {
			if (streamRef.current) {
				streamRef.current.getTracks().forEach((track) => {
					track.stop();
				});
				streamRef.current = null;
				onStreamEnd?.();
			}
			if (
				audioContextRef.current &&
				audioContextRef.current.state !== "closed"
			) {
				audioContextRef.current.close();
				audioContextRef.current = null;
			}
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
				animationRef.current = 0;
			}
			return;
		}

		const setupMicrophone = async () => {
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

				historyRef.current = [];
			} catch (error) {
				logError("UseMicrophone", error);
				onError?.(error as Error);
			}
		};

		setupMicrophone();

		return () => {
			if (streamRef.current) {
				streamRef.current.getTracks().forEach((track) => {
					track.stop();
				});
				streamRef.current = null;
				onStreamEnd?.();
			}
			if (
				audioContextRef.current &&
				audioContextRef.current.state !== "closed"
			) {
				audioContextRef.current.close();
				audioContextRef.current = null;
			}
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
				animationRef.current = 0;
			}
		};
	}, [
		active,
		deviceId,
		fftSize,
		smoothingTimeConstant,
		onError,
		onStreamReady,
		onStreamEnd,
		streamRef,
		audioContextRef,
		animationRef,
		analyserRef,
		historyRef,
	]);
}
