import { RadialIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

export function LoadingIndicator() {
	const loadingMessages = [
		"Thinking...",
		"Finding the right words...",
		"Just a sec...",
	] as const;
	const [messageIndex, setMessageIndex] = useState(0);

	useEffect(() => {
		const interval = setInterval(() => {
			setMessageIndex((prev) => (prev + 1) % 3);
		}, 2500);
		return () => clearInterval(interval);
	}, []);

	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			className="flex items-center gap-3 p-4 rounded-lg bg-system-surface-secondary text-muted-foreground border border-border/40 shadow-sm"
		>
			<div className="size-7 flex-shrink-0">
				<motion.div
					animate={{ rotate: 360 }}
					transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
					className="size-full"
				>
					<HugeiconsIcon
						icon={RadialIcon}
						className="size-7 text-muted-foreground"
					/>
				</motion.div>
			</div>
			<AnimatePresence mode="wait" initial={false}>
				<motion.span
					key={messageIndex}
					initial={{ opacity: 0, y: 4 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -4 }}
					transition={{ duration: 0.2 }}
					className="text-xs font-extrabold uppercase tracking-widest"
				>
					{loadingMessages[messageIndex]}
				</motion.span>
			</AnimatePresence>
		</motion.div>
	);
}
