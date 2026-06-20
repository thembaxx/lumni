import {
	PlayFreeIcons,
	RefreshIcon,
	SquareIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { m } from "framer-motion";
import { memo, useRef, useState } from "react";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { Button } from "@/components/ui/button";
import type { ChatMessage } from "@/hooks/use-chat";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/lib/shared/format";
import { iOSEase } from "@/lib/utils/animation";
import { ImageViewer } from "./ImageViewer";
import { SmartImage } from "./SmartImage";

const VOICE_BARS = [0.4, 0.65, 0.85, 0.55, 0.3] as const;

interface MessageBubbleProps {
	message: ChatMessage;
	onRetry?: (messageId: string) => void;
}

export const MessageBubble = memo(function MessageBubble({
	message,
	onRetry,
}: MessageBubbleProps) {
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
		const isPaperPlaneing =
			message.processingStatus === "sending" ||
			message.processingStatus === "idle";

		return (
			<>
				<m.div
					initial={{ opacity: 0, y: 10, scale: 0.95 }}
					animate={{ opacity: 1, y: 0, scale: 1 }}
					transition={{ type: "spring", stiffness: 300, damping: 26 }}
					className={cn(
						"ml-auto max-w-[calc(100%-3rem)]",
						isUser ? "mr-0" : "mr-auto",
					)}
				>
					<div
						className={cn(
							"overflow-hidden rounded-lg",
							isUser
								? "bg-system-accent text-white"
								: "border border-border/40 bg-system-surface-secondary text-foreground",
						)}
					>
						{message.imageUrl ? (
							<m.button
								onClick={() => setImageViewerOpen(true)}
								className="group relative block w-full max-w-70 cursor-pointer"
								whileTap={{ scale: 0.98 }}
								transition={{ duration: 0.15 }}
							>
								<SmartImage
									src={message.imageUrl}
									alt={message.imageFileName || "User uploaded image"}
									className={cn(
										"max-h-50 w-full object-cover",
										isError && "opacity-50 grayscale",
									)}
								/>
								<div
									className={cn(
										"absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30 dark:bg-white/0 dark:group-hover:bg-white/10",
										isPaperPlaneing && "bg-black/30 dark:bg-white/10",
									)}
								>
									{isPaperPlaneing && (
										<div className="flex size-10 items-center justify-center rounded-full bg-black/40 dark:bg-white/15">
											<div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
										</div>
									)}
								</div>
							</m.button>
						) : (
							<div className="flex size-48 items-center justify-center bg-muted">
								<div className="size-6 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
							</div>
						)}

						<div className="flex items-center justify-between gap-3 p-2 px-3">
							<span className="ios-caption-3 max-w-30 truncate font-extrabold uppercase tracking-tight opacity-80">
								{message.imageFileName || "Image"}
								{message.imageFileSize &&
									` (${formatBytes(message.imageFileSize)})`}
							</span>
							{isError && onRetry && (
								<Button
									variant="ghost"
									size="icon"
									onClick={() => onRetry(message.id)}
									className="shrink-0 rounded-full bg-white/20 hover:bg-white/30 dark:bg-black/20 dark:hover:bg-black/30"
									aria-label="Retry"
								>
									<HugeiconsIcon icon={RefreshIcon} data-icon />
								</Button>
							)}
						</div>

						{isError && message.error && (
							<div className="px-3 pb-2">
								<p className="text-destructive text-xs">{message.error}</p>
								{onRetry && (
									<Button
										variant="link"
										size="sm"
										onClick={() => onRetry(message.id)}
										className="h-auto p-0 text-background/80 text-xs hover:text-background"
									>
										Try again
									</Button>
								)}
							</div>
						)}
					</div>
				</m.div>

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
		const bars = VOICE_BARS;

		return (
			<m.div
				initial={{ opacity: 0, y: 10, scale: 0.95 }}
				animate={{ opacity: 1, y: 0, scale: 1 }}
				transition={{ type: "spring", stiffness: 300, damping: 26 }}
				className={cn(
					"flex max-w-[calc(100%-3rem)] items-center gap-4 rounded-lg p-4 text-sm",
					isUser
						? "ml-auto rounded-br-none bg-system-accent text-white shadow-level-2"
						: "mr-auto rounded-bl-none border border-border/40 bg-system-surface-secondary text-foreground shadow-sm",
				)}
			>
				<m.button
					onClick={togglePlay}
					className={cn(
						"relative flex size-11 shrink-0 items-center justify-center rounded-full shadow-sm transition-colors",
						isUser
							? "bg-white/20 hover:bg-white/30 dark:bg-black/20 dark:hover:bg-black/30"
							: "border border-border/40 bg-white hover:bg-secondary dark:bg-system-surface dark:hover:bg-system-surface-secondary",
					)}
					aria-label={isPlaying ? "Pause" : "Play"}
					whileTap={{ scale: 0.96 }}
					transition={{ duration: 0.15, ease: iOSEase }}
				>
					<span
						className={cn(
							"absolute inset-0 flex items-center justify-center transition-[opacity,scale,filter] duration-300 ease-[cubic-bezier(0.2,0,0,1)]",
							isPlaying
								? "scale-100 opacity-100 blur-0"
								: "scale-[0.25] opacity-0 blur-sm",
						)}
					>
						<HugeiconsIcon
							icon={SquareIcon}
							className="size-3.5 fill-current"
						/>
					</span>
					<span
						className={cn(
							"absolute inset-0 flex items-center justify-center transition-[opacity,scale,filter] duration-300 ease-[cubic-bezier(0.2,0,0,1)]",
							isPlaying
								? "scale-[0.25] opacity-0 blur-sm"
								: "scale-100 opacity-100 blur-0",
						)}
					>
						<HugeiconsIcon
							icon={PlayFreeIcons}
							className="ml-0.5 size-4 fill-current"
						/>
					</span>
				</m.button>
				<div className="flex min-w-0 flex-col gap-1">
					<span className="ios-caption-3 font-extrabold uppercase tracking-widest opacity-80">
						{isPlaying ? "Playing…" : "Voice message"}
					</span>
					<div className="flex items-center gap-2">
						<div className="flex h-5 items-center gap-1">
							{bars.map((height, i) => (
								<m.div
									key={`bar-${height}`}
									className={cn(
										"w-1.25 rounded-full",
										isUser
											? "bg-white/40 dark:bg-black/20"
											: "bg-system-accent/40",
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
			</m.div>
		);
	}

	return (
		<m.div
			initial={{ opacity: 0, y: 10, scale: 0.95 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			transition={{ type: "spring", stiffness: 300, damping: 26 }}
			className={cn(
				"overflow-wrap-anywhere max-w-[calc(100%-3rem)] rounded-lg p-4 font-medium text-sm leading-relaxed motion-reduce:animate-none motion-reduce:transition-none",
				isUser
					? "ml-auto rounded-br-none bg-system-accent text-white shadow-level-2"
					: "mr-auto rounded-bl-none border border-border/40 bg-system-surface-secondary text-foreground shadow-sm",
			)}
		>
			<MarkdownRenderer content={message.content} />
		</m.div>
	);
});
