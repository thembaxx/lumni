"use client";

import { Cancel01Icon, Chat01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { ChatInput } from "@/components/chat/ChatInput";
import { ImageProcessingIndicator } from "@/components/chat/ImageProcessingIndicator";
import { ImageViewer } from "@/components/chat/ImageViewer";
import { LoadingIndicator } from "@/components/chat/LoadingIndicator";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { SmartImage } from "@/components/chat/SmartImage";
import { WelcomeState } from "@/components/chat/WelcomeState";
import { Button } from "@/components/ui/button";
import { useChat } from "@/hooks/use-chat";
import { useImageChatWithSend } from "@/hooks/use-image-chat";

export default function ChatPage() {
	const chat = useChat();
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const { imageProcessing, sendImage, retryLastImage, resetState } =
		useImageChatWithSend(chat);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	});

	return (
		<div className="flex flex-col h-full bg-background/95">
			<div className="p-4 border-b border-border/30 flex items-center justify-between shrink-0">
				<div className="flex items-center gap-2">
					<div className="size-9 rounded-full bg-system-accent/10 flex items-center justify-center">
						<HugeiconsIcon
							icon={Chat01Icon}
							className="size-6 text-system-accent"
						/>
					</div>
					<span className="text-base font-extrabold tracking-tight">
						Study Assistant
					</span>
				</div>
				<Link href="/dashboard">
					<Button variant="ghost" size="icon" className="rounded-full">
						<HugeiconsIcon
							icon={Cancel01Icon}
							className="size-5 text-muted-foreground"
						/>
					</Button>
				</Link>
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
				onDismissImageProcessing={() => resetState()}
			/>
		</div>
	);
}
