"use client";

import { motion } from "framer-motion";
import { LottieWrapper } from "@/components/lottie";
import { Card, CardContent } from "@/components/ui/card";
import { iOSEase } from "@/lib/utils/animation";

export function FlashcardsLoading() {
	return (
		<motion.div
			initial={{ opacity: 0, y: 12 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.4, ease: iOSEase }}
			className="min-h-screen bg-background p-4 flex items-center justify-center"
		>
			<Card className="max-w-md w-full">
				<CardContent className="p-8 text-center flex flex-col items-center gap-4">
					<LottieWrapper animation="loading-lumni" className="w-16 h-16" loop />
					<p className="text-muted-foreground">Loading flashcards...</p>
				</CardContent>
			</Card>
		</motion.div>
	);
}
