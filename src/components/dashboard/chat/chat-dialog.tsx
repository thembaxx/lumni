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
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
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
import {
	formatBytes,
	useImageChat,
	useImageChatWithSend,
} from "@/hooks/use-image-chat";
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
			<div className="text-center">
				<motion.h2
					initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
					animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
					transition={{ delay: 0.1, duration: 0.35, ease: [0.2, 0, 0, 1] }}
					className="text-xl font-semibold text-foreground mb-2"
				>
					Hi! I&apos;m your study assistant
				</motion.h2>
				<motion.p
					initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
					animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
					transition={{ delay: 0.2, duration: 0.35, ease: [0.2, 0, 0, 1] }}
					className="text-muted-foreground text-sm"
				>
					Ask me anything about your studies!
				</motion.p>
			</div>
		</div>
	);
}

function SmartImage({
	src,
	alt,
	className,
}: {
	src: string;
	alt: string;
	className?: string;
}) {
	const isDataUrl = src.startsWith("data:");
	if (isDataUrl) {
		return (
			<img
				src={src}
				alt={alt}
				className={cn(
					"outline outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10",
					className,
				)}
			/>
		);
	}
	return (
		<Image
			src={src}
			alt={alt}
			fill={false}
			width={0}
			height={0}
			className={cn(
				"outline outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10",
				className,
			)}
			unoptimized
		/>
	);
}

function ImageViewer({
	src,
	alt,
	open,
	onClose,
}: {
	src: string;
	alt: string;
	open: boolean;
	onClose: () => void;
}) {
	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogPortal>
				<DialogOverlay className="bg-black/95" />
				<DialogContent
					className="max-w-none w-screen h-screen p-0 border-0 rounded-none m-0 inset-0"
					showCloseButton={false}
				>
					<div className="relative w-full h-full flex items-center justify-center">
						<SmartImage
							src={src}
							alt={alt}
							className="max-w-full max-h-full object-contain"
						/>
						<Button
							variant="ghost"
							size="icon"
							onClick={onClose}
							className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white"
							aria-label="Close image viewer"
						>
							<X className="w-5 h-5" />
						</Button>
					</div>
				</DialogContent>
			</DialogPortal>
		</Dialog>
	);
}

function MessageBubble({
	message,
	onRetry,
}: {
	message: ChatMessage;
	onRetry?: (messageId: string) => void;
}) {
	const isUser = message.role === "user";
	const [isPlaying, setIsPlaying] = useState(false);
	const [imageViewerOpen, setImageViewerOpen] = useState(false);
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

	if (message.type === "image") {
		const isError = message.processingStatus === "error";
		const isSending =
			message.processingStatus === "sending" ||
			message.processingStatus === "idle";

		return (
			<>
				<motion.div
					initial={{ opacity: 0, y: 10, scale: 0.95 }}
					animate={{ opacity: 1, y: 0, scale: 1 }}
					transition={{ type: "spring", stiffness: 300, damping: 25 }}
					className={cn("max-w-[85%] ml-auto", isUser ? "mr-0" : "mr-auto")}
				>
					<div
						className={cn(
							"rounded-2xl overflow-hidden",
							isUser
								? "bg-primary text-primary-foreground"
								: "bg-secondary/80 text-foreground",
						)}
					>
						{message.imageUrl ? (
							<motion.button
								onClick={() => setImageViewerOpen(true)}
								className="relative w-full max-w-[280px] cursor-pointer group block"
								whileTap={{ scale: 0.98 }}
								transition={{ duration: 0.15 }}
							>
								<SmartImage
									src={message.imageUrl}
									alt={message.imageFileName || "User uploaded image"}
									className={cn(
										"w-full max-h-[200px] object-cover",
										isError && "opacity-50 grayscale",
									)}
								/>
								<div
									className={cn(
										"absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors",
										isSending && "bg-black/30",
									)}
								>
									{isSending && (
										<div className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center">
											<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
										</div>
									)}
								</div>
							</motion.button>
						) : (
							<div className="w-48 h-48 bg-muted flex items-center justify-center">
								<div className="w-6 h-6 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
							</div>
						)}

						<div className="p-2 px-3 flex items-center justify-between gap-3">
							<span className="text-xs opacity-70 truncate max-w-[120px]">
								{message.imageFileName || "Image"}
								{message.imageFileSize &&
									` (${formatBytes(message.imageFileSize)})`}
							</span>
							{isError && onRetry && (
								<Button
									variant="ghost"
									size="icon"
									onClick={() => onRetry(message.id)}
									className="w-7 h-7 rounded-full shrink-0 hover:bg-primary-foreground/20"
									aria-label="Retry"
								>
									<RefreshCw className="w-3.5 h-3.5" />
								</Button>
							)}
						</div>

						{isError && message.error && (
							<div className="px-3 pb-2">
								<p className="text-xs text-destructive">{message.error}</p>
								{onRetry && (
									<Button
										variant="link"
										size="sm"
										onClick={() => onRetry(message.id)}
										className="h-auto p-0 text-xs text-primary-foreground/80 hover:text-primary-foreground"
									>
										Try again
									</Button>
								)}
							</div>
						)}
					</div>
				</motion.div>

				<ImageViewer
					src={message.imageUrl || ""}
					alt={message.imageFileName || "User uploaded image"}
					open={imageViewerOpen}
					onClose={() => setImageViewerOpen(false)}
				/>
			</>
		);
	}

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
							isPlaying ? "opacity-100 scale-100" : "opacity-0 scale-50",
						)}
					>
						<Square className="w-3 h-3 fill-current" />
					</span>
					<span
						className={cn(
							"absolute inset-0 flex items-center justify-center transition-all duration-300",
							isPlaying ? "opacity-0 scale-50" : "opacity-100 scale-100",
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
										isUser
											? "bg-primary-foreground/60"
											: "bg-muted-foreground/40",
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
	const loadingMessages = [
		"Thinking...",
		"Finding the right words...",
		"Just a sec...",
	] as const;
	const [messageIndex, setMessageIndex] = useState(0);

	useEffect(() => {
		const interval = setInterval(() => {
			setMessageIndex((prev) => (prev + 1) % 3);
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
					{loadingMessages[messageIndex]}
				</motion.span>
			</AnimatePresence>
		</motion.div>
	);
}

function ImageProcessingIndicator({
	state,
	onDismiss,
}: {
	state: {
		status: string;
		progress: number;
		progressMessage: string;
		error: string | null;
	};
	onDismiss: () => void;
}) {
	if (state.status === "idle") return null;

	const isError = state.status === "error";

	return (
		<motion.div
			initial={{ opacity: 0, y: -8, scaleY: 0.8 }}
			animate={{ opacity: 1, y: 0, scaleY: 1 }}
			exit={{ opacity: 0, y: -8, scaleY: 0.8 }}
			transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
			style={{ transformOrigin: "top" }}
			className={cn(
				"px-3 py-2 rounded-lg border text-sm",
				isError
					? "bg-destructive/10 border-destructive/30 text-destructive"
					: "bg-secondary/60 border-border/30 text-foreground",
			)}
		>
			<div className="flex items-center gap-2">
				{isError ? (
					<>
						<span className="flex-1 truncate text-xs">{state.error}</span>
						<Button
							variant="ghost"
							size="icon"
							onClick={onDismiss}
							className="w-6 h-6 shrink-0"
							aria-label="Dismiss error"
						>
							<X className="w-3 h-3" />
						</Button>
					</>
				) : (
					<>
						<div className="w-4 h-4 shrink-0">
							<div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
						</div>
						<span className="flex-1 truncate text-xs">
							{state.progressMessage}
						</span>
						{state.status !== "success" && (
							<span className="text-xs tabular-nums text-muted-foreground">
								{state.progress}%
							</span>
						)}
					</>
				)}
			</div>
			{state.status !== "error" && state.status !== "success" && (
				<Progress
					value={state.progress}
					className="h-1 mt-1.5 [&>div]:bg-primary"
				/>
			)}
		</motion.div>
	);
}

function ChatInput({
	onSend,
	isLoading,
	onSendImage,
	imageProcessing,
	onDismissImageProcessing,
}: {
	onSend: (message: string) => void;
	isLoading: boolean;
	onSendImage: (file: File) => void;
	imageProcessing: {
		status: string;
		progress: number;
		progressMessage: string;
		error: string | null;
	};
	onDismissImageProcessing: () => void;
}) {
	const [input, setInput] = useState("");
	const [isFocused, setIsFocused] = useState(false);
	const [voicePressed, setVoicePressed] = useState(false);
	const [voiceDialogOpen, setVoiceDialogOpen] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);
	const cameraInputRef = useRef<HTMLInputElement>(null);
	const uploadInputRef = useRef<HTMLInputElement>(null);

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

	const handleFileSelect =
		(type: "camera" | "upload") =>
		(event: React.ChangeEvent<HTMLInputElement>) => {
			const file = event.target.files?.[0];
			if (!file) return;

			if (!file.type.startsWith("image/")) {
				return;
			}

			onSendImage(file);
			event.target.value = "";
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

			<AnimatePresence>
				{imageProcessing.status !== "idle" && (
					<ImageProcessingIndicator
						state={imageProcessing}
						onDismiss={onDismissImageProcessing}
					/>
				)}
			</AnimatePresence>

			<div
				className={cn(
					"bg-secondary/60 dark:bg-secondary/40 rounded-2xl p-4 transition-[transform,border-color,box-shadow] duration-300 border mt-2",
					isFocused
						? "ring-2 ring-primary/20 border-primary/30 scale-[1.01]"
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

				<input
					ref={cameraInputRef}
					type="file"
					accept="image/*"
					capture="environment"
					className="hidden"
					onChange={handleFileSelect("camera")}
					disabled={isLoading}
				/>
				<input
					ref={uploadInputRef}
					type="file"
					accept="image/*"
					className="hidden"
					onChange={handleFileSelect("upload")}
					disabled={isLoading}
				/>

				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<DropdownMenu>
							<DropdownMenuTrigger>
								<div
									role="button"
									tabIndex={0}
									className={cn(
										"inline-flex shrink-0 items-center justify-center rounded-lg w-10 h-10",
										"bg-muted/60 hover:bg-muted text-muted-foreground cursor-pointer",
										"transition-[transform,background-color,box-shadow] duration-150 ease-out",
										"active:scale-[0.96]",
										"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
										isLoading &&
											"opacity-50 pointer-events-none cursor-not-allowed",
									)}
									aria-label="Add image"
									onKeyDown={(e) => {
										if (e.key === "Enter" || e.key === " ") {
											e.preventDefault();
										}
									}}
								>
									<HugeiconsIcon
										icon={Camera01Icon}
										className="w-4 h-4 toolbutton-icon"
									/>
								</div>
							</DropdownMenuTrigger>
							<DropdownMenuContent side="top" align="start" className="w-48">
								<DropdownMenuItem
									onClick={() => cameraInputRef.current?.click()}
									disabled={isLoading}
									className="gap-2"
								>
									<Camera className="w-4 h-4" />
									Take a photo
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => uploadInputRef.current?.click()}
									disabled={isLoading}
									className="gap-2"
								>
									<Upload className="w-4 h-4" />
									Upload a photo
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>

					<div className="flex items-center gap-2">
						<Button
							variant="ghost"
							size="icon"
							onClick={() => setVoiceDialogOpen(true)}
							className="w-8 h-8 rounded-lg bg-muted/60 hover:bg-muted toolbutton"
							disabled={isLoading}
						>
							<HugeiconsIcon
								icon={Mic02Icon}
								className="w-4 h-4 text-muted-foreground toolbutton-icon"
							/>
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
					{chat.messages.length === 0 ? (
						<WelcomeState />
					) : (
						<div className="flex-1 overflow-y-auto p-4 space-y-3">
							<AnimatePresence mode="popLayout">
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
