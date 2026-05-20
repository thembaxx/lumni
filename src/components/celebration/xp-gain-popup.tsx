"use client";

import { SparklesIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, m } from "framer-motion";

interface XPGainPopupProps {
	amount: number;
	visible: boolean;
}

export function XPGainPopup({ amount, visible }: XPGainPopupProps) {
	return (
		<AnimatePresence initial={false}>
			{visible && (
				<m.div
					initial={{ opacity: 0, y: 20, scale: 0.5 }}
					animate={{ opacity: 1, y: 0, scale: 1 }}
					exit={{ opacity: 0, y: -20, scale: 0.8 }}
					transition={{ type: "spring", stiffness: 400, damping: 20 }}
					className="pointer-events-none fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2"
				>
					<m.div
						className="flex items-center gap-2 rounded-full bg-warning px-6 py-3 text-primary-foreground shadow-lg"
						animate={{
							scale: [1, 1.1, 1],
						}}
						transition={{ duration: 0.3, repeat: 2 }}
					>
						<m.div
							animate={{ rotate: [0, 15, -15, 0] }}
							transition={{ duration: 0.5, repeat: 3 }}
						>
							<HugeiconsIcon icon={SparklesIcon} className="size-5" />
						</m.div>
						<span className="font-extrabold text-xl">+{amount} XP</span>
					</m.div>
				</m.div>
			)}
		</AnimatePresence>
	);
}
