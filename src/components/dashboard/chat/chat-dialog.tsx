"use client";

import {
	Camera01FreeIcons,
	MessageIcon,
	SentIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, motion } from "framer-motion";
import { Book as BookLucide, Mic as MicLucide } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { LottieWrapper } from "@/components/lottie/lottie-wrapper";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { type ChatMessage, useChat } from "@/hooks/use-chat";
import { cn } from "@/lib/utils";

interface ChatDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

function WelcomeState() {
	return (
		<div className="flex-1 flex flex-col items-center justify-center p-8">
			<div className="w-48 h-48 mb-6">
				<LottieWrapper animation="empty-search" loop={true} autoplay={true} />
			</div>
			<motion.div
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.2 }}
				className="text-center"
			>
				<h2 className="text-xl font-semibold text-foreground mb-2">
					Hi! I&apos;m your study assistant
				</h2>
				<p className="text-muted-foreground text-sm">
					Ask me anything about your studies!
				</p>
			</motion.div>
		</div>
	);
}

function MessageBubble({ message }: { message: ChatMessage }) {
	const isUser = message.role === "user";

	return (
		<motion.div
			initial={{ opacity: 0, y: 10, scale: 0.95 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			transition={{ type: "spring", stiffness: 300, damping: 25 }}
			className={cn(
				"max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed",
				isUser
					? "bg-primary text-primary-foreground ml-auto rounded-br-md"
					: "bg-secondary/80 text-foreground mr-auto rounded-bl-md",
			)}
		>
			{message.content}
		</motion.div>
	);
}

function LoadingIndicator() {
	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			className="flex items-center gap-2 p-3 rounded-2xl bg-secondary/80 text-muted-foreground"
		>
			<div className="flex gap-1">
				<motion.span
					className="w-2 h-2 rounded-full bg-muted-foreground/60"
					animate={{ scale: [1, 1.3, 1] }}
					transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
				/>
				<motion.span
					className="w-2 h-2 rounded-full bg-muted-foreground/60"
					animate={{ scale: [1, 1.3, 1] }}
					transition={{ repeat: Infinity, duration: 0.6, delay: 0.15 }}
				/>
				<motion.span
					className="w-2 h-2 rounded-full bg-muted-foreground/60"
					animate={{ scale: [1, 1.3, 1] }}
					transition={{ repeat: Infinity, duration: 0.6, delay: 0.3 }}
				/>
			</div>
			<span className="text-xs">Thinking...</span>
		</motion.div>
	);
}

function ChatInput({
	onSend,
	isLoading,
}: {
	onSend: (message: string) => void;
	isLoading: boolean;
}) {
	const [input, setInput] = useState("");
	const [isFocused, setIsFocused] = useState(false);
	const [voicePressed, setVoicePressed] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	const handleSubmit = (e?: React.FormEvent) => {
		e?.preventDefault();
		if (input.trim() && !isLoading) {
			onSend(input);
			setInput("");
		}
	};

	return (
		<div className="p-4 border-t border-border/50 bg-background/80 backdrop-blur-xl">
			<div
				className={cn(
					"bg-secondary/60 dark:bg-secondary/40 rounded-2xl p-4 transition-all duration-300 border",
					isFocused
						? "ring-2 ring-primary/20 border-primary/30"
						: "border-border/30",
				)}
			>
				<form onSubmit={handleSubmit}>
					<input
						ref={inputRef}
						type="text"
						placeholder="Ask me anything..."
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onFocus={() => setIsFocused(true)}
						onBlur={() => setIsFocused(false)}
						disabled={isLoading}
						className="w-full bg-transparent text-foreground placeholder:text-muted-foreground/60 text-sm outline-none mb-3 input-focus rounded-md font-medium"
					/>
				</form>

				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<button
							className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center hover:bg-muted transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background toolbutton"
							aria-label="Add attachment"
						>
							<HugeiconsIcon
								icon={Camera01FreeIcons}
								className="w-4 h-4 text-muted-foreground toolbutton-icon"
							/>
						</button>
						<button className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center hover:bg-muted transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background toolbutton">
							<BookLucide className="w-4 h-4 text-muted-foreground toolbutton-icon" />
						</button>
					</div>

					<div className="flex items-center gap-2">
						<button
							className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center hover:bg-muted transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background toolbutton"
							aria-label="Voice input"
						>
							<MicLucide className="w-4 h-4 text-muted-foreground toolbutton-icon" />
						</button>
						<button
							className={cn(
								"w-9 h-9 rounded-lg bg-primary flex items-center justify-center hover:opacity-90 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background voice-btn",
								voicePressed && "voice-btn-pressed",
								(isLoading || !input.trim()) && "opacity-50 cursor-not-allowed",
							)}
							aria-label="Send message"
							onClick={() => {
								if (input.trim() && !isLoading) {
									setVoicePressed(true);
									handleSubmit();
									setTimeout(() => setVoicePressed(false), 300);
								}
							}}
							disabled={!input.trim() || isLoading}
						>
							<HugeiconsIcon
								icon={SentIcon}
								className={cn(
									"w-4 h-4 text-primary-foreground voice-btn-icon",
									voicePressed && "scale-125",
								)}
							/>
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

export function ChatDialog({ open, onOpenChange }: ChatDialogProps) {
	const { messages, isLoading, sendMessage, clearChat } = useChat();
	const messagesEndRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	});

	const handleClose = () => {
		clearChat();
		onOpenChange(false);
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
						<div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
							<HugeiconsIcon
								icon={MessageIcon}
								className="w-4 h-4 text-primary"
							/>
						</div>
						<span className="text-lg font-semibold">Study Assistant</span>
					</div>
				</div>

				<div className="flex-1 flex flex-col overflow-hidden">
					{messages.length === 0 ? (
						<WelcomeState />
					) : (
						<div className="flex-1 overflow-y-auto p-4 space-y-3">
							<AnimatePresence mode="popLayout">
								{messages.map((message) => (
									<MessageBubble key={message.id} message={message} />
								))}
								{isLoading && <LoadingIndicator />}
							</AnimatePresence>
							<div ref={messagesEndRef} />
						</div>
					)}
				</div>

				<ChatInput onSend={sendMessage} isLoading={isLoading} />
			</DialogContent>
		</Dialog>
	);
}
