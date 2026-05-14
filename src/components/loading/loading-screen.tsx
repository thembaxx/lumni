"use client";

import { CircleNotch } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
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
	const router = useRouter();
	const { authReady } = useAuth();
	const redirectedRef = useRef(false);

	const redirect = useCallback(() => {
		if (redirectedRef.current) return;
		redirectedRef.current = true;
		setIsVisible(false);
		setTimeout(() => router.replace(redirectTo), 400);
	}, [router, redirectTo]);

	const handleManualEnter = () => {
		setProgress(100);
		if (redirectedRef.current) return;
		setTimeout(redirect, 300);
	};

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

		return () => cancelAnimationFrame(frameId);
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
		<AnimatePresence>
			{isVisible && (
				<motion.div
					key="loading-screen"
					initial={{ opacity: 0, scale: 0.96 }}
					animate={{ opacity: 1, scale: 1 }}
					exit={{ opacity: 0, y: -12, scale: 0.96 }}
					transition={{ duration: 0.4, ease: iOSEase }}
					className="flex flex-col items-center gap-[--space-8]"
				>
					<motion.div
						initial={{ opacity: 0, scale: 0.8 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ duration: 0.5, ease: iOSEase, delay: 0.05 }}
						className="relative"
					>
						<motion.div
							className="absolute inset-0 rounded-full bg-[--system-accent]/20 blur-xl"
							animate={{ scale: [1, 1.15, 1] }}
							transition={{
								duration: 2.5,
								repeat: Infinity,
								ease: iOSEase,
							}}
						/>
						<div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-[--system-accent]/10 border border-[--system-accent]/20">
							<motion.div
								animate={{ rotate: 360 }}
								transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
								className="size-14"
							>
								<CircleNotch className="size-14 text-foreground" />
							</motion.div>
						</div>
					</motion.div>

					<motion.div
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.4, ease: iOSEase, delay: 0.15 }}
						className="text-center space-y-1"
					>
						<h2 className="ios-headline text-[--system-text-primary]">
							Loading Lumni
						</h2>
						<p className="ios-footnote text-[--system-text-secondary]">
							Preparing your study experience...
						</p>
					</motion.div>

					<motion.div
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.4, ease: iOSEase, delay: 0.25 }}
					>
						<Progress
							value={progress}
							className="w-48 transition-[width] duration-[var(--duration-slow)] ease-[var(--ease-ios)]"
						/>
					</motion.div>

					{showSkipButton && progress < 100 && (
						<motion.div
							initial={{ opacity: 0, y: 12 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.35, ease: iOSEase }}
						>
							<Button
								onClick={handleManualEnter}
								className="rounded-full bg-[--system-accent] text-background hover:scale-105 h-10 px-8"
							>
								Skip & Enter
							</Button>
						</motion.div>
					)}
				</motion.div>
			)}
		</AnimatePresence>
	);
}
