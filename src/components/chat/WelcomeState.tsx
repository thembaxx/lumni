import { SparklesIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { motion } from "framer-motion";
import { iOSEase } from "@/lib/utils/animation";

export function WelcomeState() {
	return (
		<div className="flex flex-1 flex-col items-center justify-center p-8">
			<div className="mb-6 size-48">
				<motion.div
					animate={{ scale: [1, 1.2, 1] }}
					transition={{ duration: 1.5, repeat: Infinity }}
					className="flex size-full items-center justify-center"
				>
					<HugeiconsIcon
						icon={SparklesIcon}
						className="size-20 text-primary/60"
					/>
				</motion.div>
			</div>
			<div className="text-center">
				<motion.h2
					initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
					animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
					transition={{ delay: 0.1, duration: 0.35, ease: iOSEase }}
					className="mb-2 font-semibold text-2xl text-foreground tracking-tight"
				>
					Hi! I&apos;m your study assistant
				</motion.h2>
				<motion.p
					initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
					animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
					transition={{ delay: 0.2, duration: 0.35, ease: iOSEase }}
					className="text-pretty font-medium text-[13px] text-muted-foreground/60 opacity-60"
				>
					Ask me anything about your studies!
				</motion.p>
			</div>
		</div>
	);
}
