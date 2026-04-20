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
	const router = useRouter();
	const handleRedirect = useCallback(() => {
		router.replace(redirectTo);
	}, [router, redirectTo]);

	useEffect(() => {
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
		<div className="flex flex-col items-center gap-6">
			<Progress value={progress} />
			<Button
				onClick={handleManualEnter}
				disabled={progress === 100}
				className="rounded-full bg-primary text-primary-foreground hover:bg-primary/80 h-10 px-8"
			>
				Dashboard
			</Button>
		</div>
	);
}
