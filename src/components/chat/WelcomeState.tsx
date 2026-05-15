import { Sparkle } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { cn } from "@/lib/shared";
import { iOSEase } from "@/lib/utils/animation";

export function WelcomeState() {
	return (
		<div className="flex-1 flex flex-col items-center justify-center p-8">
			<div className="size-48 mb-6">
				<motion.div
					animate={{ scale: [1, 1.2, 1] }}
					transition={{ duration: 1.5, repeat: Infinity }}
					className="size-full flex items-center justify-center"
				>
					<Sparkle className="size-20 text-primary/60" />
				</motion.div>
			</div>
			<div className="text-center">
				<motion.h2
					initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
					animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
					transition={{ delay: 0.1, duration: 0.35, ease: iOSEase }}
					className="text-2xl font-semibold text-foreground mb-2 tracking-tight"
				>
					Hi! I&apos;m your study assistant
				</motion.h2>
				<motion.p
					initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
					animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
					transition={{ delay: 0.2, duration: 0.35, ease: iOSEase }}
					className="text-muted-foreground/60 text-[13px] font-medium opacity-60 text-pretty"
				>
					Ask me anything about your studies!
				</motion.p>
			</div>
		</div>
	);
}
