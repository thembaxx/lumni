"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { LottieWrapper } from "@/components/lottie";
import { Button } from "@/components/ui/button";
import { iOSEase } from "@/lib/utils/animation";
import { appConfig } from "../../app.config";

export default function NotFound() {
	return (
		<motion.div
			initial={{ opacity: 0, y: 12 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.4, ease: iOSEase }}
			className="min-h-screen flex flex-col items-center justify-center bg-[--system-background]"
		>
			<main className="flex flex-col items-center gap-[--space-6] text-center px-[--space-4]">
				<motion.div
					initial={{ scale: 0.8 }}
					animate={{ scale: 1 }}
					transition={{ duration: 0.5, ease: iOSEase, delay: 0.1 }}
					className="relative"
				>
					<div className="absolute inset-0 rounded-full bg-secondary blur-xl" />
					<div className="relative w-24 h-24 rounded-full bg-secondary/60 flex items-center justify-center">
						<LottieWrapper
							animation="page-404"
							className="w-16 h-16"
							loop={false}
						/>
					</div>
				</motion.div>
				<motion.div
					initial={{ opacity: 0, y: 8 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4, ease: iOSEase, delay: 0.2 }}
					className="space-y-[--space-2]"
				>
					<h2 className="ios-title-2 text-[--system-text-primary]">
						Page not found
					</h2>
					<p className="ios-callout text-[--system-text-secondary]">
						The page you&apos;re looking for doesn&apos;t exist or has been
						moved.
					</p>
				</motion.div>
				<motion.div
					initial={{ opacity: 0, y: 8 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4, ease: iOSEase, delay: 0.3 }}
				>
					<Link href="/">
						<Button className="bg-[--system-accent] text-background hover:bg-[--system-accent]/80">
							Back to {appConfig.name}
						</Button>
					</Link>
				</motion.div>
			</main>
		</motion.div>
	);
}
