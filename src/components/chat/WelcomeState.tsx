import { motion } from "framer-motion";
import { LottieWrapper } from "@/components/lottie/lottie-wrapper";
import { cn } from "@/lib/utils";
import { iOSEase } from "@/lib/utils/animation";

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
					transition={{ delay: 0.1, duration: 0.35, ease: iOSEase }}
					className="text-2xl font-bold text-foreground mb-2 tracking-tight"
				>
					Hi! I&apos;m your study assistant
				</motion.h2>
				<motion.p
					initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
					animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
					transition={{ delay: 0.2, duration: 0.35, ease: iOSEase }}
					className="text-muted-foreground text-sm font-bold uppercase tracking-widest opacity-80"
				>
					Ask me anything about your studies!
				</motion.p>
			</div>
		</div>
	);
}
