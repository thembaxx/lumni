"use client";

import { Cancel01Icon, Chat01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence } from "framer-motion";
import { useEffect, useRef } from "react";
import { ChatInput } from "@/components/chat/ChatInput";
import { LoadingIndicator } from "@/components/chat/LoadingIndicator";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { WelcomeState } from "@/components/chat/WelcomeState";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useChat } from "@/hooks/use-chat";
import { useImageChatWithSend } from "@/hooks/use-image-chat";

interface ChatDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function ChatDialog({ open, onOpenChange }: ChatDialogProps) {
	const chat = useChat();
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const { imageProcessing, sendImage, retryLastImage, resetState, cleanup } =
		useImageChatWithSend(chat);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	});

	const handleClose = () => {
		cleanup();
		chat.clearChat();
		onOpenChange(false);
	};

	const handleDismissImageProcessing = () => {
		resetState();
	};

	return (
		<Dialog
			open={open}
			onOpenChange={onOpenChange}
			modal={true}
			disablePointerDismissal={false}
		>
			<DialogContent
				showCloseButton={false}
				className="top-0 left-0 m-0 flex size-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-0 bg-background/95 p-0 backdrop-blur-xl"
			>
				<div className="flex shrink-0 flex-row items-center justify-between border-border/30 border-b py-4 pr-5 pl-4">
					<div className="flex items-center gap-1">
						<div className="flex size-9 grow items-center justify-center rounded-full bg-system-accent/10">
							<HugeiconsIcon
								icon={Chat01Icon}
								className="size-6 text-system-accent"
							/>
						</div>
						<span className="text-left font-extrabold text-base leading-1 tracking-tight">
							Study Assistant
						</span>
					</div>
					<Button
						variant="ghost"
						size="icon"
						onClick={handleClose}
						className="rounded-full hover:bg-secondary"
					>
						<HugeiconsIcon
							icon={Cancel01Icon}
							className="size-5 text-muted-foreground"
						/>
					</Button>
				</div>

				<div className="flex flex-1 flex-col overflow-hidden">
					{chat.messages.length === 0 ? (
						<WelcomeState />
					) : (
						<div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
							<AnimatePresence mode="popLayout" initial={false}>
								{chat.messages.map((message) => (
									<MessageBubble
										key={message.id}
										message={message}
										onRetry={retryLastImage}
									/>
								))}
								{chat.isLoading && <LoadingIndicator />}
							</AnimatePresence>
							<div ref={messagesEndRef} />
						</div>
					)}
				</div>

				<ChatInput
					onPaperPlane={chat.sendMessage}
					isLoading={chat.isLoading}
					onPaperPlaneImage={sendImage}
					imageProcessing={imageProcessing}
					onDismissImageProcessing={handleDismissImageProcessing}
				/>
			</DialogContent>
		</Dialog>
	);
}
