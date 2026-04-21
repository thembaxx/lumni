"use client";

import { motion } from "framer-motion";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { VoiceRecorder } from "@/components/ui/voice-recorder";

interface AnimatedDialogContentProps {
	children?: React.ReactNode;
}

export function AnimatedDialogContent({
	children,
}: AnimatedDialogContentProps) {
	return (
		<Dialog>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="sm:max-w-md">
				<motion.div
					initial={{ opacity: 0, scale: 0.9, y: 20 }}
					animate={{ opacity: 1, scale: 1, y: 0 }}
					transition={{
						type: "spring",
						damping: 25,
						stiffness: 300,
					}}
				>
					<DialogHeader>
						<motion.div
							initial={{ opacity: 0, x: -10 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ delay: 0.1 }}
						>
							<DialogTitle>Voice Recording</DialogTitle>
						</motion.div>
						<motion.div
							initial={{ opacity: 0, x: -10 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ delay: 0.15 }}
						>
							<DialogDescription>
								Record your voice message and send it.
							</DialogDescription>
						</motion.div>
					</DialogHeader>
					<motion.div
						initial={{ opacity: 0, y: 15 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.2, duration: 0.4 }}
					>
						<VoiceRecorder onRecordingComplete={() => {}} />
					</motion.div>
				</motion.div>
			</DialogContent>
		</Dialog>
	);
}
