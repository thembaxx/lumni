"use client";

import { LiveWaveform } from "@/components/ui/live-waveform";
import { cn } from "@/lib/utils";

interface WaveformDisplayProps {
	isRecording: boolean;
	audioBlob: Blob | null;
}

export function WaveformDisplay({
	isRecording,
	audioBlob,
}: WaveformDisplayProps) {
	return (
		<div className="relative w-full overflow-hidden rounded-lg bg-muted/20 p-2">
			<LiveWaveform
				active={isRecording}
				processing={!isRecording && !audioBlob}
				mode="static"
				barColor="oklch(76.7% 0.179 65°)"
				height={64}
				barWidth={3}
				barGap={2}
				fadeEdges
				className={cn(
					"w-full transition-transform duration-300",
					isRecording && "scale-y-110",
				)}
			/>
		</div>
	);
}
