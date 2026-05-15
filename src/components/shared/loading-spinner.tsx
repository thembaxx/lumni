"use client";

import { cn } from "@/lib/shared";

interface LoadingSpinnerProps {
	size?: "sm" | "md" | "lg";
	className?: string;
}

const spinnerSizes = {
	sm: "size-4 border-2",
	md: "size-5 border-2",
	lg: "size-6 border-[2.5px]",
};

export function LoadingSpinner({
	size = "md",
	className,
}: LoadingSpinnerProps) {
	return (
		<div
			className={cn(
				"rounded-full border-muted border-t-foreground animate-spin",
				spinnerSizes[size],
				className,
			)}
		/>
	);
}

interface LoadingOverlayProps {
	message?: string;
	spinnerSize?: "sm" | "md" | "lg";
	className?: string;
}

export function LoadingOverlay({
	message = "Loading...",
	spinnerSize = "md",
	className,
}: LoadingOverlayProps) {
	return (
		<div
			className={cn(
				"absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm",
				className,
			)}
		>
			<div className="flex flex-col items-center gap-3">
				<LoadingSpinner size={spinnerSize} />
				<span className="text-xs text-muted-foreground">{message}</span>
			</div>
		</div>
	);
}
