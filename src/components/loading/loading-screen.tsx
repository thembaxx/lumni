"use client";

import { RadialIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, m } from "framer-motion";
import { useRouter } from "@/i18n/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/lib/auth/auth-context";
import { iOSEase } from "@/lib/utils/animation";

interface LoadingScreenProps {
	duration?: number;
	redirectTo?: string;
	skipDelay?: number;
}

export function LoadingScreen({
	duration = 2000,
	redirectTo = "/dashboard",
	skipDelay = 5000,
}: LoadingScreenProps) {
	const [progress, setProgress] = useState(0);
	const [isVisible, setIsVisible] = useState(true);
	const [showSkipButton, setShowSkipButton] = useState(false);
	const { replace } = useRouter();
	const { authReady } = useAuth();
	const redirectedRef = useRef(false);
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
		undefined,
	);

	const redirect = useCallback(() => {
		if (redirectedRef.current) return;
		redirectedRef.current = true;
		setIsVisible(false);
		timeoutRef.current = setTimeout(() => replace(redirectTo), 400);
	}, [replace, redirectTo]);

	const handleManualEnter = () => {
		setProgress(100);
		redirect();
	};

	useEffect(() => {
		return () => {
			if (timeoutRef.current) clearTimeout(timeoutRef.current);
		};
	}, []);

	useEffect(() => {
		const startTime = performance.now();
		let frameId: number;

		const animate = (currentTime: number) => {
			const elapsed = currentTime - startTime;

			let targetProgress: number;
			if (!authReady) {
				targetProgress = Math.min((elapsed / duration) * 70, 70);
			} else {
				const timeSinceReady = elapsed;
				targetProgress = Math.min(
					70 + (timeSinceReady / (duration * 0.3)) * 30,
					100,
				);
			}

			setProgress(targetProgress);

			if (targetProgress < 100) {
				frameId = requestAnimationFrame(animate);
			} else {
				setTimeout(redirect, 300);
			}
		};

		frameId = requestAnimationFrame(animate);

		return () => {
			cancelAnimationFrame(frameId);
			if (timeoutRef.current) clearTimeout(timeoutRef.current);
		};
	}, [duration, authReady, redirect]);

	useEffect(() => {
		const timer = setTimeout(() => {
			if (progress < 100) {
				setShowSkipButton(true);
			}
		}, skipDelay);
		return () => clearTimeout(timer);
	}, [skipDelay, progress]);

	return (
		<AnimatePresence initial={false}>
			{isVisible && (
				<m.div
					key="loading-screen"
					initial={{ opacity: 0, scale: 0.96 }}
					animate={{ opacity: 1, scale: 1 }}
					exit={{ opacity: 0, y: -12, filter: "blur(4px)", scale: 0.96 }}
					transition={{ duration: 0.15, ease: "easeIn" }}
					className="flex flex-col items-center"
				>
					<m.div
						initial={{ opacity: 0, scale: 0.8, filter: "blur(4px)" }}
						animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
						transition={{ duration: 0.5, ease: iOSEase, delay: 0 }}
						className="relative"
					>
						<m.div
							className="absolute inset-0 rounded-full bg-[--system-accent]/20 blur-xl"
							animate={{ scale: [1, 1.15, 1] }}
							transition={{
								duration: 2.5,
								repeat: Infinity,
								ease: iOSEase,
							}}
						/>
						<div className="relative flex size-20 items-center justify-center rounded-2xl border border-[--system-accent]/20 bg-[--system-accent]/10">
							<m.div
								animate={{ rotate: 360 }}
								transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
								className="size-14"
							>
								<HugeiconsIcon
									icon={RadialIcon}
									className="size-14 text-system-accent"
								/>
							</m.div>
						</div>
					</m.div>

					<m.h2
						initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
						animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
						transition={{ duration: 0.4, ease: iOSEase, delay: 0.08 }}
						className="ios-title-2 mt-[--space-6] text-center text-[--system-text-primary]"
					>
						Lumni
					</m.h2>

					<m.p
						initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
						animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
						transition={{ duration: 0.35, ease: iOSEase, delay: 0.12 }}
						className="ios-footnote mt-[--space-2] text-center text-[--system-text-secondary]"
					>
						Preparing your study experience…
					</m.p>

					<m.div
						initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
						animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
						transition={{ duration: 0.4, ease: iOSEase, delay: 0.2 }}
						className="mt-[--space-6]"
					>
						<Progress
							value={progress}
							className="w-56 transition-[width] duration-[var(--duration-slow)] ease-[var(--ease-ios)]"
						/>
					</m.div>

					{showSkipButton && progress < 100 && (
						<m.div
							initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
							animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
							transition={{ duration: 0.35, ease: iOSEase }}
							className="mt-[--space-6]"
						>
							<Button
								onClick={handleManualEnter}
								className="h-10 rounded-full bg-[--system-accent] px-8 text-background hover:scale-105"
							>
								Skip & Enter
							</Button>
						</m.div>
					)}
				</m.div>
			)}
		</AnimatePresence>
	);
}
