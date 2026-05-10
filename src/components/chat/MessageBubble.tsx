import { motion } from "framer-motion";
import { Play, RefreshCw, Square } from "lucide-react";
import { useRef, useState } from "react";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { Button } from "@/components/ui/button";
import { type ChatMessage } from "@/hooks/use-chat";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/lib/utils/format";
import { ImageViewer } from "./ImageViewer";
import { SmartImage } from "./SmartImage";

interface MessageBubbleProps {
	message: ChatMessage;
	onRetry?: (messageId: string) => void;
}

export function MessageBubble({ message, onRetry }: MessageBubbleProps) {
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
								className="relative w-full max-w-70 cursor-pointer group block"
								whileTap={{ scale: 0.98 }}
								transition={{ duration: 0.15 }}
							>
								<SmartImage
									src={message.imageUrl}
									alt={message.imageFileName || "User uploaded image"}
									className={cn(
										"w-full max-h-50 object-cover",
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
							<span className="text-xs opacity-70 truncate max-w-30">
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
											: { height: `${Math.round(height * 20)}px` }
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
			<MarkdownRenderer content={message.content} />
		</motion.div>
	);
}
