import { motion } from "framer-motion";
import { LottieWrapper } from "@/components/lottie/lottie-wrapper";
import { cn } from "@/lib/utils";

export function WelcomeState() {
	return (
		<div className="flex-1 flex flex-col items-center justify-center p-8">
			<div className="w-48 h-48 mb-6">
				<LottieWrapper animation="empty-search" loop={true} autoplay={true} />
			</div>
			<div className="text-center">
				<motion.h2
					initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
					animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
					transition={{ delay: 0.1, duration: 0.35, ease: [0.2, 0, 0, 1] }}
					className="text-xl font-semibold text-foreground mb-2"
				>
					Hi! I&apos;m your study assistant
				</motion.h2>
				<motion.p
					initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
					animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
					transition={{ delay: 0.2, duration: 0.35, ease: [0.2, 0, 0, 1] }}
					className="text-muted-foreground text-sm"
				>
					Ask me anything about your studies!
				</motion.p>
			</div>
		</div>
	);
}
