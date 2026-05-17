import {
	Camera01Icon,
	MailSend01Icon,
	Mic01Icon,
	Upload01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { AnimatedDialogContent } from "@/components/ui/animated-dialog-content";
import { Button } from "@/components/ui/button";
import {
	DropdownList,
	DropdownListContent,
	DropdownListItem,
	DropdownListTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/shared";
import { ImageProcessingIndicator } from "./ImageProcessingIndicator";

interface ChatInputProps {
	onPaperPlane: (message: string) => void;
	isLoading: boolean;
	onPaperPlaneImage: (file: File) => void;
	imageProcessing: {
		status: string;
		progress: number;
		progressMessage: string;
		error: string | null;
	};
	onDismissImageProcessing: () => void;
}

export function ChatInput({
	onPaperPlane,
	isLoading,
	onPaperPlaneImage,
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
			onPaperPlane(input);
			setInput("");
		}
	};

	const handleVoiceRecording = (audioBlob: Blob | null) => {
		if (!audioBlob) return;
		const reader = new FileReader();
		reader.onloadend = () => {
			onPaperPlane(reader.result as string);
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

			onPaperPlaneImage(file);
			event.target.value = "";
		};

	return (
		<div className="p-4 border-t border-border/50 bg-background/80 backdrop-blur-xl">
			<AnimatedDialogContent
				open={voiceDialogOpen}
				onOpenChange={setVoiceDialogOpen}
				onRecordingComplete={handleVoiceRecording}
				title="Got a question?"
				description="Record your question and I&apos;ll help you find the answer."
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
					"bg-secondary/60 rounded-lg p-4 transition-[border-color,box-shadow,transform,background-color] duration-300 border mt-2",
					isFocused
						? "ring-2 ring-system-accent/20 border-system-accent/40 scale-[1.005] bg-background"
						: "border-border/30",
				)}
			>
				<div className="mb-3">
					<Input
						ref={inputRef}
						type="text"
						placeholder="Ask me a question about your studies..."
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onFocus={() => setIsFocused(true)}
						onBlur={() => setIsFocused(false)}
						disabled={isLoading}
						className="bg-transparent text-foreground placeholder:text-muted-foreground/50 border-0 shadow-none p-0 focus-visible:ring-2 focus-visible:ring-system-accent/30"
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
						<DropdownList>
							<DropdownListTrigger
								className={cn(
									"inline-flex shrink-0 items-center justify-center rounded-md size-10",
									"hover:bg-secondary text-muted-foreground cursor-pointer shadow-sm border border-border/30",
									"transition-colors active:scale-[0.96]",
									"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-system-accent/50",
									isLoading &&
										"opacity-50 pointer-events-none cursor-not-allowed",
								)}
								aria-label="Add image"
							>
								<HugeiconsIcon icon={Camera01Icon} data-icon />
							</DropdownListTrigger>
							<DropdownListContent side="top" align="start" className="w-48">
								<DropdownListItem
									onClick={() => cameraInputRef.current?.click()}
									disabled={isLoading}
									className="gap-2 font-extrabold text-xs uppercase tracking-tight"
								>
									<HugeiconsIcon icon={Camera01Icon} data-icon="inline-start" />
									Take a photo
								</DropdownListItem>
								<DropdownListItem
									onClick={() => uploadInputRef.current?.click()}
									disabled={isLoading}
									className="gap-2 font-extrabold text-xs uppercase tracking-tight"
								>
									<HugeiconsIcon icon={Upload01Icon} data-icon="inline-start" />
									Upload a photo
								</DropdownListItem>
							</DropdownListContent>
						</DropdownList>
					</div>

					<div className="flex items-center gap-2">
						<Button
							variant="ghost"
							size="icon"
							onClick={() => setVoiceDialogOpen(true)}
							className="rounded-md hover:bg-secondary size-10 border border-border/40"
							disabled={isLoading}
						>
							<HugeiconsIcon
								icon={Mic01Icon}
								data-icon
								className="text-muted-foreground toolbutton-icon"
							/>
						</Button>
						<Button
							variant="ghost"
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
								"size-10 rounded-md bg-system-accent text-white hover:bg-system-accent/90 shadow-level-2",
								voicePressed && "scale-[0.95] brightness-90",
							)}
							aria-label="Send message"
						>
							<HugeiconsIcon
								icon={MailSend01Icon}
								data-icon
								className={cn(voicePressed && "scale-110")}
							/>
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
