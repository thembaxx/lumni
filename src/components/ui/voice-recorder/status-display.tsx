"use client";

import { cn } from "@/lib/utils";

type DisplayMode =
	| "idle"
	| "recording"
	| "playing"
	| "permission-denied"
	| "validation-error"
	| "success";

interface StatusDisplayProps {
	displayMode: DisplayMode;
	isTooShort: boolean;
	isTooLong: boolean;
	recordingError: string | null;
	statusText: string;
	timerDisplay: string | null;
}

export function StatusDisplay({
	displayMode,
	isTooShort,
	isTooLong,
	recordingError,
	statusText,
	timerDisplay,
}: StatusDisplayProps) {
	const isRecording = displayMode === "recording";
	const isPlaying = displayMode === "playing";
	const showPermissionError = displayMode === "permission-denied";
	const showValidationError = displayMode === "validation-error";
	const sendSuccess = displayMode === "success";
	return (
		<div className="flex min-h-14 flex-col items-center gap-1">
			{showValidationError && (
				<span className="animate-fade-in-up text-destructive text-xs">
					{isTooShort && "Recording too short (min 1s)"}
					{isTooLong && "Maximum duration reached"}
					{recordingError && !isTooShort && !isTooLong && recordingError}
				</span>
			)}
			<span
				className={cn(
					"font-medium text-xs uppercase tracking-widest transition-colors duration-200",
					sendSuccess
						? "text-success dark:text-success-foreground"
						: isRecording
							? "animate-pulse text-destructive"
							: isPlaying
								? "animate-pulse text-[--system-accent]"
								: showPermissionError
									? "text-destructive"
									: "text-muted-foreground",
				)}
			>
				{showPermissionError ? "Permission Required" : statusText}
			</span>
			{(isRecording || isPlaying || timerDisplay) && (
				<span className="animate-fade-in-up font-extrabold font-mono text-2xl text-foreground tabular-nums">
					{timerDisplay}
				</span>
			)}
		</div>
	);
}
