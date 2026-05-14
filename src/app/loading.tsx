"use client";

import { CircleNotch } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { iOSEase } from "@/lib/utils/animation";

export default function Loading() {
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
					Loading
				</motion.h2>

			<motion.p
				initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
				animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
					transition={{ duration: 0.35, ease: iOSEase, delay: 0.12 }}
					className="ios-footnote text-[--system-text-secondary] text-center"
				>
					Just a moment
				</motion.p>
			</div>
		</motion.div>
	);
}
