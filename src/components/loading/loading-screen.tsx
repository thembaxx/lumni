"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { LottieWrapper } from "@/components/lottie";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface LoadingScreenProps {
	duration?: number;
	redirectTo?: string;
	useLottie?: boolean;
}

export function LoadingScreen({
	duration = 2000,
	redirectTo = "/dashboard",
	useLottie = true,
}: LoadingScreenProps) {
	const [progress, setProgress] = useState(0);
	const [isVisible, setIsVisible] = useState(true);
	const router = useRouter();

	const handleRedirect = useCallback(() => {
		setIsVisible(false);
		setTimeout(() => router.replace(redirectTo), 300);
	}, [router, redirectTo]);

	const handleManualEnter = () => {
		setProgress(100);
		handleRedirect();
	};

	return (
		<div
			className={`flex flex-col items-center gap-8 transition-all duration-500 ease-out-quart ${
				isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
			}`}
		>
			<div className="relative">
				<div className="absolute inset-0 animate-pulse rounded-full bg-primary/20 blur-xl" />
				<div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20">
					{useLottie ? (
						<LottieWrapper
							animation="loading-lumni"
							className="w-12 h-12"
							loop
						/>
					) : (
						<span className="text-2xl font-semibold text-primary">L</span>
					)}
				</div>
			</div>

			<div className="text-center space-y-1">
				<h2 className="text-lg font-medium text-foreground tracking-tight">
					Loading Lumni
				</h2>
				<p className="text-xs text-muted-foreground">
					Preparing your study experience...
				</p>
			</div>

			<Progress
				value={progress}
				className="w-48 transition-all duration-150 ease-out-quart"
			/>
			<Button
				onClick={handleManualEnter}
				disabled={progress === 100}
				className="rounded-full bg-primary text-primary-foreground hover:scale-105 active:scale-95 transition-all duration-150 h-10 px-8"
			>
				{progress === 100 ? "Entering..." : "Skip & Enter"}
			</Button>
		</div>
	);
}
