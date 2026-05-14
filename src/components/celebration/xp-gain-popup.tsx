"use client";

import { Sparkle } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";

interface XPGainPopupProps {
	amount: number;
	visible: boolean;
}

export function XPGainPopup({
	amount,
	visible,
}: XPGainPopupProps) {
	return (
		<AnimatePresence initial={false}>
			{visible && (
				<motion.div
					initial={{ opacity: 0, y: 20, scale: 0.5 }}
					animate={{ opacity: 1, y: 0, scale: 1 }}
					exit={{ opacity: 0, y: -20, scale: 0.8 }}
					transition={{ type: "spring", stiffness: 400, damping: 20 }}
					className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none"
				>
					<motion.div
						className="flex items-center gap-2 bg-warning text-primary-foreground px-6 py-3 rounded-full shadow-lg"
						animate={{
							scale: [1, 1.1, 1],
						}}
						transition={{ duration: 0.3, repeat: 2 }}
					>
						<motion.div
							animate={{ rotate: [0, 15, -15, 0] }}
							transition={{ duration: 0.5, repeat: 3 }}
						>
							<Sparkle className="size-5" />
						</motion.div>
						<span className="text-xl font-extrabold">+{amount} XP</span>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}