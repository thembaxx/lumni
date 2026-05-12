import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

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
			<div className="flex gap-1.5">
				<motion.span
					className="w-2.5 h-2.5 rounded-full bg-system-accent/40"
					animate={{
						scale: [1, 1.3, 1],
						backgroundColor: [
							"var(--system-accent-alpha-20)",
							"var(--system-accent)",
							"var(--system-accent-alpha-20)",
						],
					}}
					transition={{ repeat: Infinity, duration: 0.8, delay: 0 }}
				/>
				<motion.span
					className="w-2.5 h-2.5 rounded-full bg-system-accent/40"
					animate={{
						scale: [1, 1.3, 1],
						backgroundColor: [
							"var(--system-accent-alpha-20)",
							"var(--system-accent)",
							"var(--system-accent-alpha-20)",
						],
					}}
					transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }}
				/>
				<motion.span
					className="w-2.5 h-2.5 rounded-full bg-system-accent/40"
					animate={{
						scale: [1, 1.3, 1],
						backgroundColor: [
							"var(--system-accent-alpha-20)",
							"var(--system-accent)",
							"var(--system-accent-alpha-20)",
						],
					}}
					transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }}
				/>
			</div>
			<AnimatePresence mode="wait" initial={false}>
				<motion.span
					key={messageIndex}
					initial={{ opacity: 0, y: 4 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -4 }}
					transition={{ duration: 0.2 }}
					className="text-xs font-bold uppercase tracking-widest"
				>
					{loadingMessages[messageIndex]}
				</motion.span>
			</AnimatePresence>
		</motion.div>
	);
}
