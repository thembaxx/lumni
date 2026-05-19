"use client";

import { RadialIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { m, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
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
	const messageIndexRef = useRef(0);
	const [currentMessage, setCurrentMessage] = useState(loadingMessages[0]);

	useEffect(() => {
		const interval = setInterval(() => {
			messageIndexRef.current =
				(messageIndexRef.current + 1) % loadingMessages.length;
			setCurrentMessage(loadingMessages[messageIndexRef.current]);
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
		<m.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.3, ease: iOSEase }}
			className="flex min-h-dvh flex-col items-center justify-center bg-background"
		>
			<div className="flex flex-col items-center gap-[--space-6]">
				<m.div
					initial={{ opacity: 0, scale: 0.8, filter: "blur(4px)" }}
					animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
					transition={{ duration: 0.5, ease: iOSEase }}
				>
					<m.div
						animate={{ rotate: 360 }}
						transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
					>
						<HugeiconsIcon
							icon={RadialIcon}
							className="size-14 text-system-accent"
						/>
					</m.div>
				</m.div>

				<m.h2
					initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
					animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
					transition={{ duration: 0.4, ease: iOSEase, delay: 0.08 }}
					className="ios-title-2 text-center text-[--system-text-primary]"
				>
					Lumni
				</m.h2>

				<m.p
					initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
					animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
					transition={{ duration: 0.35, ease: iOSEase, delay: 0.12 }}
					className="ios-footnote text-center text-[--system-text-secondary]"
				>
					{currentMessage}
				</m.p>

				{/* Subtle pulsing effect on the loading text */}
				<m.span style={{ scale: pulseAnimation }} className="ml-1">
					.
				</m.span>
			</div>
		</m.div>
	);
}
