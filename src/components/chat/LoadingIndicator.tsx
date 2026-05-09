import { AnimatePresence, motion } from "framer-motion";
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
			className="flex items-center gap-2 p-3 rounded-2xl bg-secondary/80 text-muted-foreground"
		>
			<div className="flex gap-1">
				<motion.span
					className="w-2 h-2 rounded-full bg-muted-foreground/60"
					animate={{ scale: [1, 1.3, 1] }}
					transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
				/>
				<motion.span
					className="w-2 h-2 rounded-full bg-muted-foreground/60"
					animate={{ scale: [1, 1.3, 1] }}
					transition={{ repeat: Infinity, duration: 0.6, delay: 0.15 }}
				/>
				<motion.span
					className="w-2 h-2 rounded-full bg-muted-foreground/60"
					animate={{ scale: [1, 1.3, 1] }}
					transition={{ repeat: Infinity, duration: 0.6, delay: 0.3 }}
				/>
			</div>
			<AnimatePresence mode="wait">
				<motion.span
					key={messageIndex}
					initial={{ opacity: 0, y: 4 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -4 }}
					transition={{ duration: 0.2 }}
					className="text-xs"
				>
					{loadingMessages[messageIndex]}
				</motion.span>
			</AnimatePresence>
		</motion.div>
	);
}
