import { Camera01Icon, Mic02Icon, SentIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AnimatedDialogContent } from "@/components/ui/animated-dialog-content";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ImageProcessingIndicator } from "./ImageProcessingIndicator";

interface ChatInputProps {
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
}

export function ChatInput({
	onSend,
	isLoading,
	onSendImage,
	imageProcessing,
	onDismissImageProcessing,
}: ChatInputProps) {
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
		<div className="p-[--space-4] border-t border-border/50 bg-background/80 backdrop-blur-xl">
			<AnimatedDialogContent
				open={voiceDialogOpen}
				onOpenChange={setVoiceDialogOpen}
				onRecordingComplete={handleVoiceRecording}
				title="Voice Message"
				description="Record your voice message and send it."
			/>

			<AnimatePresence initial={false}>
				{imageProcessing.status !== "idle" && (
					<ImageProcessingIndicator
						state={imageProcessing}
						onDismiss={onDismissImageProcessing}
					/>
				)}
			</AnimatePresence>

			<div
				className={cn(
					"bg-secondary/60 dark:bg-secondary/40 rounded-[--radius-card] p-[--space-4] transition-[transform,border-color,box-shadow] duration-[var(--duration-slow)] border mt-2",
					isFocused
						? "ring-2 ring-[--system-accent]/20 border-[--system-accent]/30 scale-[1.01]"
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
						className="bg-transparent text-foreground placeholder:text-muted-foreground/60 ios-body outline-none font-medium border-0 shadow-none p-0 focus-visible:ring-0"
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
							<DropdownMenuTrigger
								className={cn(
									"inline-flex shrink-0 items-center justify-center rounded-[--radius-button] size-10",
									"bg-muted/60 hover:bg-muted text-muted-foreground cursor-pointer",
									"transition-[scale,background-color,box-shadow] duration-[var(--duration-fast)] ease-[var(--ease-ios)]",
									"active:scale-[0.96]",
									"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--system-accent]/50",
									isLoading &&
										"opacity-50 pointer-events-none cursor-not-allowed",
								)}
								aria-label="Add image"
							>
								<HugeiconsIcon
									icon={Camera01Icon}
									className="w-4 h-4 toolbutton-icon"
								/>
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
							className="rounded-[--radius-button] bg-muted/60 hover:bg-muted toolbutton"
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
								"size-9 voice-btn",
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
