"use client";

import FlashlightIcon from "@hugeicons/core-free-icons/FlashlightIcon";
import SwitchCamera from "@hugeicons/core-free-icons/CameraRotated01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

interface CameraPreviewProps {
	onCapture: (dataUrl: string) => void;
	onClose: () => void;
}

export function CameraPreview({ onCapture, onClose }: CameraPreviewProps) {
	const videoRef = useRef<HTMLVideoElement>(null);
	const streamRef = useRef<MediaStream | null>(null);
	const [facingMode, setFacingMode] = useState<"environment" | "user">(
		"environment",
	);
	const [torchOn, setTorchOn] = useState(false);
	const [torchSupported, setTorchSupported] = useState(false);

	const stopTracks = useCallback(() => {
		if (streamRef.current) {
			streamRef.current.getTracks().forEach((t) => {
				t.stop();
			});
		}
	}, []);

	const startCamera = useCallback(async () => {
		stopTracks();
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
			});
			streamRef.current = stream;
			if (videoRef.current) {
				videoRef.current.srcObject = stream;
			}
			const track = stream.getVideoTracks()[0];
			const cap = track.getCapabilities?.() as
				| Record<string, unknown>
				| undefined;
			if (cap?.torch !== undefined) {
				setTorchSupported(true);
			}
		} catch {
			// Camera permission denied or unavailable
		}
	}, [facingMode, stopTracks]);

	useEffect(() => {
		startCamera();
		return () => {
			stopTracks();
		};
	}, [startCamera, stopTracks]);

	const toggleTorch = async () => {
		if (!streamRef.current) return;
		const track = streamRef.current.getVideoTracks()[0];
		if (!track) return;
		try {
			await track.applyConstraints({
				advanced: [{ torch: !torchOn } as unknown as MediaTrackConstraintSet],
			});
			setTorchOn(!torchOn);
		} catch {
			// Torch not supported
		}
	};

	const flipCamera = () => {
		setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
	};

	const capture = () => {
		const video = videoRef.current;
		if (!video) return;
		const canvas = document.createElement("canvas");
		canvas.width = video.videoWidth;
		canvas.height = video.videoHeight;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		ctx.drawImage(video, 0, 0);
		const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
		onCapture(dataUrl);
	};

	return (
		<div className="relative flex flex-col">
			<div className="relative overflow-hidden rounded-xl bg-black">
				<video
					ref={videoRef}
					autoPlay
					playsInline
					className="h-80 w-full object-cover"
				>
					<track kind="captions" />
				</video>
				<div className="pointer-events-none absolute inset-0 flex items-center justify-center">
					<div className="size-64 rounded-2xl border-2 border-white/50" />
				</div>
				<div className="absolute top-3 right-3 flex flex-col gap-2">
					{torchSupported && (
						<button
							type="button"
							onClick={toggleTorch}
							className="flex size-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
							aria-label="Toggle flash"
						>
							<HugeiconsIcon
								icon={FlashlightIcon}
								className={`size-4 ${torchOn ? "text-yellow-400" : ""}`}
							/>
						</button>
					)}
					<button
						type="button"
						onClick={flipCamera}
						className="flex size-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
						aria-label="Flip camera"
					>
						<HugeiconsIcon icon={SwitchCamera} className="size-4" />
					</button>
				</div>
			</div>
			<div className="flex items-center justify-center gap-6 px-6 py-4">
				<Button
					variant="outline"
					onClick={onClose}
					className="h-10 w-24 rounded-xl"
				>
					Cancel
				</Button>
				<button
					type="button"
					onClick={capture}
					className="flex size-14 items-center justify-center rounded-full border-4 border-white bg-[--system-accent] shadow-level-2 transition-transform active:scale-90"
					aria-label="Capture photo"
				>
					<div className="size-10 rounded-full bg-white" />
				</button>
			</div>
		</div>
	);
}
