"use client";

import { CircleNotch } from "@phosphor-icons/react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useState } from "react";
import { iOSEase } from "@/lib/utils/animation";

// Product-specific loading messages for Lumni (educational app for South African students)
const loadingMessages = [
	"Crunching your latest numbers...",
	"Preparing your practice questions...",
	"Syncing with your study materials...",
	"Getting you exam-ready...",
	"Loading your personalized content...",
	"Just a moment while we set things up...",
	"Almost ready! One more thing...",
	"Gathering your flashcards...",
	"Setting up your quiz session...",
	"Optimizing your learning experience...",
];

export default function Loading() {
	const [_messageIndex, setMessageIndex] = useState(0);
	const [currentMessage, setCurrentMessage] = useState(loadingMessages[0]);

	// Rotate messages every 3 seconds
	useEffect(() => {
		const interval = setInterval(() => {
			setMessageIndex((prev) => {
				const nextIndex = (prev + 1) % loadingMessages.length;
				setCurrentMessage(loadingMessages[nextIndex]);
				return nextIndex;
			});
		}, 3000);

		return () => clearInterval(interval);
	}, []);

	// Create a subtle pulse animation for the text
	const pulse = useMotionValue(1);
	const pulseAnimation = useTransform(
		pulse,
		[0, 0.5, 1],
		[0.98, 1.02, 1], // Subtle scale pulse
	);

	// Animate the pulse value
	useEffect(() => {
		const animatePulse = () => {
			pulse.set(0);
			pulse.set(1);
		};

		const interval = setInterval(animatePulse, 2000); // Pulse every 2 seconds
		return () => clearInterval(interval);
	}, [pulse]);

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.3, ease: iOSEase }}
			className="min-h-[100dvh] flex flex-col items-center justify-center bg-background"
		>
			<div className="flex flex-col items-center gap-[--space-6]">
				<motion.div
					initial={{ opacity: 0, scale: 0.8, filter: "blur(4px)" }}
					animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
					transition={{ duration: 0.5, ease: iOSEase }}
				>
					<motion.div
						animate={{ rotate: 360 }}
						transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
					>
						<CircleNotch className="size-14 text-system-accent" />
					</motion.div>
				</motion.div>

				<motion.h2
					initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
					animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
					transition={{ duration: 0.4, ease: iOSEase, delay: 0.08 }}
					className="ios-title-2 text-[--system-text-primary] text-center"
				>
					Lumni
				</motion.h2>

				<motion.p
					initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
					animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
					transition={{ duration: 0.35, ease: iOSEase, delay: 0.12 }}
					className="ios-footnote text-[--system-text-secondary] text-center"
				>
					{currentMessage}
				</motion.p>

				{/* Subtle pulsing effect on the loading text */}
				<motion.span style={{ scale: pulseAnimation }} className="ml-1">
					.
				</motion.span>
			</div>
		</motion.div>
	);
}
