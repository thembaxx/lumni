import { motion } from "framer-motion";
import { Play, RefreshCw, Square } from "lucide-react";
import { useRef, useState } from "react";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { Button } from "@/components/ui/button";
import { type ChatMessage } from "@/hooks/use-chat";
import { cn } from "@/lib/utils";
import { iOSEase } from "@/lib/utils/animation";
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
							"rounded-lg overflow-hidden",
							isUser
								? "bg-system-accent text-white"
								: "bg-system-surface-secondary text-foreground border border-border/40",
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
							<span className="text-[10px] font-bold opacity-80 truncate max-w-30 uppercase tracking-tight">
								{message.imageFileName || "Image"}
								{message.imageFileSize &&
									` (${formatBytes(message.imageFileSize)})`}
							</span>
							{isError && onRetry && (
								<Button
									variant="ghost"
									size="icon"
									onClick={() => onRetry(message.id)}
									className="rounded-full shrink-0 bg-white/20 hover:bg-white/30"
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
										className="h-auto p-0 text-xs text-background/80 hover:text-background"
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
					"max-w-[85%] p-4 rounded-lg text-sm flex items-center gap-4",
					isUser
						? "bg-system-accent text-white ml-auto rounded-br-none shadow-level-2"
						: "bg-system-surface-secondary text-foreground mr-auto rounded-bl-none border border-border/40 shadow-sm",
				)}
			>
				<motion.button
					onClick={togglePlay}
					className={cn(
						"relative flex items-center justify-center w-11 h-11 rounded-full shrink-0 transition-colors shadow-sm",
						isUser
							? "bg-white/20 hover:bg-white/30"
							: "bg-white dark:bg-black/20 hover:bg-secondary border border-border/40",
					)}
					aria-label={isPlaying ? "Pause" : "Play"}
					whileTap={{ scale: 0.96 }}
					transition={{ duration: 0.15, ease: iOSEase }}
				>
					<span
						className={cn(
							"absolute inset-0 flex items-center justify-center transition-[opacity,scale,filter] duration-300 ease-[cubic-bezier(0.2,0,0,1)]",
							isPlaying
								? "opacity-100 scale-100 blur-0"
								: "opacity-0 scale-[0.25] blur-[4px]",
						)}
					>
						<Square className="w-3.5 h-3.5 fill-current" />
					</span>
					<span
						className={cn(
							"absolute inset-0 flex items-center justify-center transition-[opacity,scale,filter] duration-300 ease-[cubic-bezier(0.2,0,0,1)]",
							isPlaying
								? "opacity-0 scale-[0.25] blur-[4px]"
								: "opacity-100 scale-100 blur-0",
						)}
					>
						<Play className="w-4 h-4 fill-current ml-0.5" />
					</span>
				</motion.button>
				<div className="flex flex-col gap-1 min-w-0">
					<span className="text-[10px] font-bold uppercase tracking-widest opacity-80">
						{isPlaying ? "Playing..." : "Voice message"}
					</span>
					<div className="flex items-center gap-2">
						<div className="flex gap-1 h-5 items-center">
							{bars.map((height, i) => (
								<motion.div
									key={i}
									className={cn(
										"w-1.25 rounded-full",
										isUser ? "bg-white/40" : "bg-system-accent/40",
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
													ease: iOSEase,
												}
											: {
													duration: 0.3,
													ease: iOSEase,
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
				"max-w-[85%] p-4 rounded-lg text-sm leading-relaxed font-medium",
				isUser
					? "bg-system-accent text-white ml-auto rounded-br-none shadow-level-2"
					: "bg-system-surface-secondary text-foreground mr-auto rounded-bl-none border border-border/40 shadow-sm",
			)}
		>
			<MarkdownRenderer content={message.content} />
		</motion.div>
	);
}
