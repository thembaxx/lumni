"use client";

import CheckmarkCircle01Icon from "@hugeicons/core-free-icons/CheckmarkCircle01Icon";
import MailSend01Icon from "@hugeicons/core-free-icons/MailSend01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SendButtonProps {
	recorderState:
		| "idle"
		| "recording"
		| "recorded"
		| "playing"
		| "sending"
		| "success";
	audioBlob: Blob | null;
	isTooShort: boolean;
	isTooLong: boolean;
	onSend: () => void;
}

export function SendButton({
	recorderState,
	audioBlob,
	isTooShort,
	isTooLong,
	onSend,
}: SendButtonProps) {
	const isRecording = recorderState === "recording";
	const isPaperPlaneing = recorderState === "sending";
	const sendSuccess = recorderState === "success";
	return (
		<Button
			onClick={onSend}
			disabled={
				isRecording ||
				!audioBlob ||
				isPaperPlaneing ||
				sendSuccess ||
				isTooShort ||
				isTooLong
			}
			className={cn(
				"mt-2 w-full rounded-lg",
				sendSuccess
					? "bg-success text-primary-foreground hover:bg-success/90"
					: !isRecording && audioBlob && !isTooShort && !isTooLong
						? "bg-[--system-accent] text-background hover:opacity-90"
						: "bg-muted/50 text-muted-foreground/50",
			)}
			aria-label="Send voice message"
		>
			<span className="flex items-center gap-2">
				<AnimatePresence mode="wait" initial={false}>
					{sendSuccess ? (
						<m.span
							key="success"
							className="flex items-center gap-2"
							initial={{ opacity: 0, scale: 0.25, filter: "blur(4px)" }}
							animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
							exit={{ opacity: 0, scale: 0.25, filter: "blur(4px)" }}
							transition={{ type: "spring", duration: 0.3, bounce: 0 }}
						>
							<HugeiconsIcon icon={CheckmarkCircle01Icon} className="size-4" />
							<span>Sent!</span>
						</m.span>
					) : isPaperPlaneing ? (
						<m.span
							key="sending"
							className="flex items-center gap-2"
							initial={{ opacity: 0, scale: 0.25, filter: "blur(4px)" }}
							animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
							exit={{ opacity: 0, scale: 0.25, filter: "blur(4px)" }}
							transition={{ type: "spring", duration: 0.3, bounce: 0 }}
						>
							<span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
							<span>Sending…</span>
						</m.span>
					) : (
						<m.span
							key="idle"
							className="flex items-center gap-2"
							initial={{ opacity: 0, scale: 0.25, filter: "blur(4px)" }}
							animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
							exit={{ opacity: 0, scale: 0.25, filter: "blur(4px)" }}
							transition={{ type: "spring", duration: 0.3, bounce: 0 }}
						>
							<HugeiconsIcon icon={MailSend01Icon} className="size-4" />
							<span>Send Voice Message</span>
						</m.span>
					)}
				</AnimatePresence>
			</span>
		</Button>
	);
}
