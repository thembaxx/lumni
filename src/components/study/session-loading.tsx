"use client";

import { CircleNotch } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { LoadingShell } from "@/components/loading/loading-shell";
import { iOSEase } from "@/lib/utils/animation";

export function SessionLoading() {
	return (
		<LoadingShell>
			<div className="flex flex-col items-center gap-[--space-6]">
				<motion.div
					initial={{ opacity: 0, scale: 0.8, filter: "blur(4px)" }}
					animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
					transition={{ duration: 0.5, ease: iOSEase }}
					className="relative"
				>
					<motion.div
						className="absolute inset-0 rounded-full bg-[--system-accent]/20 blur-xl"
						animate={{ scale: [1, 1.15, 1] }}
						transition={{ duration: 2.5, repeat: Infinity, ease: iOSEase }}
					/>
					<div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-[--system-accent]/10 border border-[--system-accent]/20">
						<motion.div
							animate={{ rotate: 360 }}
							transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
							className="size-14"
						>
							<CircleNotch className="size-14 text-system-accent" />
						</motion.div>
					</div>
				</motion.div>

				<motion.h2
					initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
					animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
					transition={{ duration: 0.4, ease: iOSEase, delay: 0.08 }}
					className="ios-title-2 text-[--system-text-primary] text-center"
				>
					Study Session
				</motion.h2>

				<motion.p
					initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
					animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
					transition={{ duration: 0.35, ease: iOSEase, delay: 0.12 }}
					className="ios-footnote text-[--system-text-secondary] text-center"
				>
					Setting up your session...
				</motion.p>
			</div>
		</LoadingShell>
	);
}
