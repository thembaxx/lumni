"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { Confetti } from "@/components/celebration/confetti";
import { Button } from "@/components/ui/button";
import { iOSEase } from "@/lib/utils/animation";
import { WelcomeSVG } from "./svgs";

interface CelebrationOverlayProps {
	onComplete: () => void;
}

export function CelebrationOverlay({ onComplete }: CelebrationOverlayProps) {
	const [phase, setPhase] = useState<"enter" | "ready">("enter");
	const shouldReduceMotion = useReducedMotion();

	useEffect(() => {
		const t = setTimeout(() => setPhase("ready"), 1200);
		return () => clearTimeout(t);
	}, []);

	return (
		<div className="fixed inset-0 bg-system-grouped z-50 flex items-center justify-center">
			<Confetti trigger={true} />
			<motion.div
				initial={shouldReduceMotion ? {} : { opacity: 0, scale: 0.9 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ duration: 0.6, ease: iOSEase }}
				className="flex flex-col items-center text-center px-6 max-w-sm"
			>
				<div className="w-36 h-36 mb-6">
					<WelcomeSVG />
				</div>
				<motion.h1
					initial={shouldReduceMotion ? {} : { opacity: 0, y: 12 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4, delay: 0.3, ease: iOSEase }}
					className="ios-title-1 font-extrabold mb-3 tracking-tight text-balance"
				>
					You&apos;re ready to learn
				</motion.h1>
				<motion.p
					initial={shouldReduceMotion ? {} : { opacity: 0, y: 12 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4, delay: 0.45, ease: iOSEase }}
					className="ios-body text-muted-foreground mb-8 leading-relaxed text-pretty"
				>
					Your subjects and goals are saved. Start practicing, track your
					progress, and ace your exams.
				</motion.p>
				<motion.div
					initial={shouldReduceMotion ? {} : { opacity: 0, y: 12 }}
					animate={{
						opacity: phase === "ready" ? 1 : 0,
						y: phase === "ready" ? 0 : 12,
					}}
					transition={{ duration: 0.3, ease: iOSEase }}
				>
					{phase === "ready" && (
						<Button size="lg" onClick={onComplete}>
							Go to dashboard
						</Button>
					)}
				</motion.div>
			</motion.div>
		</div>
	);
}
