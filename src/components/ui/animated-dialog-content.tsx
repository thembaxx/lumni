"use client";

import { domAnimation, LazyMotion, m } from "framer-motion";
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
			<LazyMotion features={domAnimation}>
				<DialogContent className="sm:max-w-md">
					<m.div
						initial={{ opacity: 0, scale: 0.9, y: 20 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						transition={{
							type: "spring",
							damping: 25,
							stiffness: 300,
						}}
					>
						<DialogHeader>
							<m.div
								initial={{ opacity: 0, x: -10 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ delay: 0.1 }}
							>
								<DialogTitle>Voice Recording</DialogTitle>
							</m.div>
							<m.div
								initial={{ opacity: 0, x: -10 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ delay: 0.15 }}
							>
								<DialogDescription>
									Record your voice message and send it.
								</DialogDescription>
							</m.div>
						</DialogHeader>
						<m.div
							initial={{ opacity: 0, y: 15 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.2, duration: 0.4 }}
						>
							<VoiceRecorder onRecordingComplete={() => {}} />
						</m.div>
					</m.div>
				</DialogContent>
			</LazyMotion>
		</Dialog>
	);
}
