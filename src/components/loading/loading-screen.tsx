"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface LoadingScreenProps {
	duration?: number;
	redirectTo?: string;
}

export function LoadingScreen({
	duration = 2000,
	redirectTo = "/dashboard",
}: LoadingScreenProps) {
	const [progress, setProgress] = useState(0);
	const [isVisible, setIsVisible] = useState(false);
	const router = useRouter();

	const handleRedirect = useCallback(() => {
		setIsVisible(false);
		setTimeout(() => router.replace(redirectTo), 300);
	}, [router, redirectTo]);

	useEffect(() => {
		setIsVisible(true);

		const totalSteps = 100;
		const intervalMs = duration / totalSteps;

		const interval = setInterval(() => {
			setProgress((prev) => {
				if (prev >= 100) {
					clearInterval(interval);
					handleRedirect();
					return 100;
				}
				return prev + 1;
			});
		}, intervalMs);

		return () => clearInterval(interval);
	}, [duration, handleRedirect]);

	const handleManualEnter = () => {
		setProgress(100);
		handleRedirect();
	};

	return (
		<div
			className={`flex flex-col items-center gap-6 transition-all duration-500 ease-out-quart ${
				isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
			}`}
		>
			<Progress
				value={progress}
				className="transition-all duration-150 ease-out-quart"
			/>
			<Button
				onClick={handleManualEnter}
				disabled={progress === 100}
				className="rounded-full bg-primary text-primary-foreground hover:scale-105 active:scale-95 transition-all duration-150 h-10 px-8"
			>
				Dashboard
			</Button>
		</div>
	);
}
