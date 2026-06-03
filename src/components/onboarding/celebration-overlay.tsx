"use client";

import { m, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { Confetti } from "@/components/celebration/confetti";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { iOSEase } from "@/lib/utils/animation";
import { WelcomeSVG } from "./svgs/welcome-svg";

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
		<Dialog open={true} onOpenChange={() => {}}>
			<DialogContent showCloseButton={false} className="max-w-sm sm:max-w-sm">
				<DialogTitle className="sr-only">Celebration</DialogTitle>
				<Confetti trigger={true} />
				<m.div
					initial={shouldReduceMotion ? {} : { opacity: 0, scale: 0.9 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ duration: 0.6, ease: iOSEase }}
					className="flex max-w-sm flex-col items-center px-6 text-center"
				>
					<div className="mb-6 size-36">
						<WelcomeSVG />
					</div>
					<m.h1
						initial={shouldReduceMotion ? {} : { opacity: 0, y: 12 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.4, delay: 0.3, ease: iOSEase }}
						className="ios-title-1 mb-3 text-balance font-semibold tracking-tight"
					>
						You&apos;re ready to learn
					</m.h1>
					<m.p
						initial={shouldReduceMotion ? {} : { opacity: 0, y: 12 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.4, delay: 0.45, ease: iOSEase }}
						className="ios-body mb-8 text-pretty text-muted-foreground leading-relaxed"
					>
						Your subjects and goals are saved. Start practicing, track your
						progress, and ace your exams.
					</m.p>
					<m.div
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
					</m.div>
				</m.div>
			</DialogContent>
		</Dialog>
	);
}
