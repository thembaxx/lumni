"use client";

import { RadialIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { m } from "framer-motion";
import { LoadingShell } from "@/components/loading/loading-shell";
import { iOSEase } from "@/lib/utils/animation";

export function FlashcardsLoading() {
	return (
		<LoadingShell>
			<div className="flex flex-col items-center gap-[--space-6]">
				<m.div
					initial={{ opacity: 0, scale: 0.8, filter: "blur(4px)" }}
					animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
					transition={{ duration: 0.5, ease: iOSEase }}
					className="relative"
				>
					<m.div
						className="absolute inset-0 rounded-full bg-[--system-accent]/20 blur-xl"
						animate={{ scale: [1, 1.15, 1] }}
						transition={{ duration: 2.5, repeat: Infinity, ease: iOSEase }}
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
					className="ios-title-2 text-center text-[--system-text-primary]"
				>
					Flashcards
				</m.h2>

				<m.p
					initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
					animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
					transition={{ duration: 0.35, ease: iOSEase, delay: 0.12 }}
					className="ios-footnote text-center text-[--system-text-secondary]"
				>
					Loading your cards…
				</m.p>
			</div>
		</LoadingShell>
	);
}
