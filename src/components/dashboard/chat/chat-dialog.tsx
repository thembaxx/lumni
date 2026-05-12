"use client";

import {
	Camera01Icon,
	MessageIcon,
	Mic02Icon,
	SentIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, Play, RefreshCw, Square, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ChatInput } from "@/components/chat/ChatInput";
import { ImageProcessingIndicator } from "@/components/chat/ImageProcessingIndicator";
import { ImageViewer } from "@/components/chat/ImageViewer";
import { LoadingIndicator } from "@/components/chat/LoadingIndicator";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { SmartImage } from "@/components/chat/SmartImage";
import { WelcomeState } from "@/components/chat/WelcomeState";
import { LottieWrapper } from "@/components/lottie/lottie-wrapper";
import { AnimatedDialogContent } from "@/components/ui/animated-dialog-content";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogOverlay,
	DialogPortal,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
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
			<DialogContent className="flex flex-col translate-x-0 translate-y-0 w-full h-full max-w-none rounded-none p-0 m-0 top-0 left-0 bg-background/95 backdrop-blur-xl border-0 gap-0">
				<div className="px-4 py-3 border-b border-border/30 flex flex-row items-center justify-between shrink-0">
					<div className="flex items-center gap-3">
<div className="w-8 h-8 rounded-full bg-[--system-accent]/10 flex items-center justify-center">
						<HugeiconsIcon
							icon={MessageIcon}
							className="w-4 h-4 text-foreground"
						/>
						</div>
						<span className="text-lg font-semibold">Study Assistant</span>
					</div>
				</div>

				<div className="flex-1 flex flex-col overflow-hidden">
					{chat.messages.length === 0 ? (
						<WelcomeState />
					) : (
						<div className="flex-1 overflow-y-auto p-4 space-y-3">
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
					onSend={chat.sendMessage}
					isLoading={chat.isLoading}
					onSendImage={sendImage}
					imageProcessing={imageProcessing}
					onDismissImageProcessing={handleDismissImageProcessing}
				/>
			</DialogContent>
		</Dialog>
	);
}
