"use client";

import {
	ArrowsClockwise,
	ChatCenteredText,
	CloudArrowUp,
	Microphone,
	PaperPlane,
	Play,
	Square,
	X,
} from "@phosphor-icons/react";
import { AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { ChatInput } from "@/components/chat/ChatInput";
import { ImageProcessingIndicator } from "@/components/chat/ImageProcessingIndicator";
import { ImageViewer } from "@/components/chat/ImageViewer";
import { LoadingIndicator } from "@/components/chat/LoadingIndicator";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { SmartImage } from "@/components/chat/SmartImage";
import { WelcomeState } from "@/components/chat/WelcomeState";
import { AnimatedDialogContent } from "@/components/ui/animated-dialog-content";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogOverlay,
	DialogPortal,
} from "@/components/ui/dialog";
import {
	DropdownList,
	DropdownListContent,
	DropdownListItem,
	DropdownListTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { type ChatMessage, useChat } from "@/hooks/use-chat";
import { useImageChat, useImageChatWithSend } from "@/hooks/use-image-chat";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/lib/utils/format";

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

	const _handleClose = () => {
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
				className="flex flex-col translate-x-0 translate-y-0 size-full max-w-none rounded-none p-0 m-0 top-0 left-0 bg-background/95 backdrop-blur-xl border-0 gap-0"
			>
				<div className="pl-4 pr-5 py-4 border-b border-border/30 flex flex-row items-center justify-between shrink-0">
					<div className="flex items-center gap-1">
						<div className="size-9 rounded-full bg-system-accent/10 flex items-center grow justify-center">
							<ChatCenteredText className="size-6 text-system-accent" />
						</div>
						<span className="text-base font-extrabold leading-1 text-left tracking-tight">
							Study Assistant
						</span>
					</div>
					<Button
						variant="ghost"
						size="icon"
						onClick={() => onOpenChange(false)}
						className="rounded-full hover:bg-secondary"
					>
						<X className="size-5 text-muted-foreground" />
					</Button>
				</div>

				<div className="flex-1 flex flex-col overflow-hidden">
					{chat.messages.length === 0 ? (
						<WelcomeState />
					) : (
						<div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
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
