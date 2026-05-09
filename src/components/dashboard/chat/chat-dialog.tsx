"use client";

import {
	Camera01Icon,
	MessageIcon,
	Mic02Icon,
	SentIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Play, Square } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { LottieWrapper } from "@/components/lottie/lottie-wrapper";
import { AnimatedDialogContent } from "@/components/ui/animated-dialog-content";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
	const [isPlaying, setIsPlaying] = useState(false);
	const audioRef = useRef<HTMLAudioElement | null>(null);

	const togglePlay = () => {
		if (!message.audioDataUrl) return;

		if (!audioRef.current) {
			audioRef.current = new Audio(message.audioDataUrl);
			audioRef.current.onended = () => setIsPlaying(false);
		}

		if (isPlaying) {
			audioRef.current.pause();
			setIsPlaying(false);
		} else {
			audioRef.current.play();
			setIsPlaying(true);
		}
	};

	if (message.type === "voice") {
		const bars = [0.4, 0.65, 0.85, 0.55, 0.3];

		return (
			<motion.div
				initial={{ opacity: 0, y: 10, scale: 0.95 }}
				animate={{ opacity: 1, y: 0, scale: 1 }}
				transition={{ type: "spring", stiffness: 300, damping: 25 }}
				className={cn(
					"max-w-[85%] p-3 rounded-2xl text-sm flex items-center gap-3",
					isUser
						? "bg-primary text-primary-foreground ml-auto rounded-br-md"
						: "bg-secondary/80 text-foreground mr-auto rounded-bl-md",
				)}
			>
				<motion.button
					onClick={togglePlay}
					className={cn(
						"relative flex items-center justify-center w-10 h-10 rounded-full shrink-0 transition-colors",
						isUser
							? "bg-primary-foreground/20 hover:bg-primary-foreground/30"
							: "bg-muted hover:bg-muted/80",
					)}
					aria-label={isPlaying ? "Pause" : "Play"}
					whileTap={{ scale: 0.96 }}
					transition={{ duration: 0.15, ease: [0.25, 1, 0.5, 1] }}
				>
					<span
						className={cn(
							"absolute inset-0 flex items-center justify-center transition-all duration-300",
							isPlaying
								? "opacity-100 scale-100"
								: "opacity-0 scale-50",
						)}
					>
						<Square className="w-3 h-3 fill-current" />
					</span>
					<span
						className={cn(
							"absolute inset-0 flex items-center justify-center transition-all duration-300",
							isPlaying
								? "opacity-0 scale-50"
								: "opacity-100 scale-100",
						)}
					>
						<Play className="w-4 h-4 fill-current ml-0.5" />
					</span>
				</motion.button>
				<div className="flex flex-col gap-1 min-w-0">
					<span className="text-xs opacity-70">
						{isPlaying ? "Playing..." : "Voice message"}
					</span>
					<div className="flex items-center gap-2">
						<div className="flex gap-0.5 h-4">
							{bars.map((height, i) => (
								<motion.div
									key={i}
									className={cn(
										"w-1 rounded-full",
										isUser ? "bg-primary-foreground/60" : "bg-muted-foreground/40",
									)}
									animate={
										isPlaying
											? {
													height: [
														`${Math.round(height * 20)}px`,
														`${Math.round(height * 20 * 1.6)}px`,
														`${Math.round(height * 20 * 0.6)}px`,
														`${Math.round(height * 20 * 1.2)}px`,
														`${Math.round(height * 20)}px`,
													],
												}
											: {
													height: `${Math.round(height * 20)}px`,
												}
									}
									transition={
										isPlaying
											? {
													repeat: Infinity,
													duration: 0.8,
													delay: i * 0.1,
													ease: [0.25, 1, 0.5, 1],
												}
											: {
													duration: 0.3,
													ease: [0.25, 1, 0.5, 1],
												}
									}
									style={{ height: `${Math.round(height * 20)}px` }}
								/>
							))}
						</div>
					</div>
				</div>
			</motion.div>
		);
	}

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
	const messages = [
		"Thinking...",
		"Finding the right words...",
		"Just a sec...",
	];
	const [messageIndex, setMessageIndex] = useState(0);

	useEffect(() => {
		const interval = setInterval(() => {
			setMessageIndex((prev) => (prev + 1) % messages.length);
		}, 2500);
		return () => clearInterval(interval);
	}, []);

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
			<AnimatePresence mode="wait">
				<motion.span
					key={messageIndex}
					initial={{ opacity: 0, y: 4 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -4 }}
					transition={{ duration: 0.2 }}
					className="text-xs"
				>
					{messages[messageIndex]}
				</motion.span>
			</AnimatePresence>
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
	const [voiceDialogOpen, setVoiceDialogOpen] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	const handleSubmit = (e?: React.FormEvent) => {
		e?.preventDefault();
		if (input.trim() && !isLoading) {
			onSend(input);
			setInput("");
		}
	};

	const handleVoiceRecording = (audioBlob: Blob | null) => {
		if (!audioBlob) return;
		const reader = new FileReader();
		reader.onloadend = () => {
			onSend(reader.result as string);
		};
		reader.readAsDataURL(audioBlob);
		setVoiceDialogOpen(false);
	};

	return (
		<div className="p-4 border-t border-border/50 bg-background/80 backdrop-blur-xl">
			<AnimatedDialogContent
				open={voiceDialogOpen}
				onOpenChange={setVoiceDialogOpen}
				onRecordingComplete={handleVoiceRecording}
				title="Voice Message"
				description="Record your voice message and send it."
			/>
			<div
				className={cn(
					"bg-secondary/60 dark:bg-secondary/40 rounded-2xl p-4 transition-colors duration-300 border",
					isFocused
						? "ring-2 ring-primary/20 border-primary/30"
						: "border-border/30",
				)}
			>
				<div className="mb-3">
					<Input
						ref={inputRef}
						type="text"
						placeholder="Ask me anything..."
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onFocus={() => setIsFocused(true)}
						onBlur={() => setIsFocused(false)}
						disabled={isLoading}
						className="bg-transparent text-foreground placeholder:text-muted-foreground/60 text-sm outline-none font-medium border-0 shadow-none p-0 focus-visible:ring-0"
					/>
				</div>

				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Button
							variant="ghost"
							size="icon"
							className="w-8 h-8 rounded-lg bg-muted/60 hover:bg-muted toolbutton"
						>
							<HugeiconsIcon
								icon={Camera01Icon}
								className="w-4 h-4 text-muted-foreground toolbutton-icon"
							/>
						</Button>
					</div>

					<div className="flex items-center gap-2">
						<Button
							variant="ghost"
							size="icon"
							onClick={() => setVoiceDialogOpen(true)}
							className="w-8 h-8 rounded-lg bg-muted/60 hover:bg-muted toolbutton"
						>
							<HugeiconsIcon icon={Mic02Icon} className="w-4 h-4 text-muted-foreground toolbutton-icon"/>
						</Button>
						<Button
							variant="default"
							size="icon"
							onClick={() => {
								if (input.trim() && !isLoading) {
									setVoicePressed(true);
									handleSubmit();
									setTimeout(() => setVoicePressed(false), 300);
								}
							}}
							disabled={!input.trim() || isLoading}
							className={cn(
								"w-9 h-9 voice-btn",
								voicePressed && "voice-btn-pressed",
							)}
							aria-label="Send message"
						>
							<HugeiconsIcon
								icon={SentIcon}
								className={cn(
									"w-4 h-4 voice-btn-icon",
									voicePressed && "scale-125",
								)}
							/>
						</Button>
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

	const _handleClose = () => {
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
