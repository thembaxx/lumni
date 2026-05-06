"use client";

import { Camera01FreeIcons } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Book, Mic } from "lucide-react";
import { useState } from "react";
import { VoiceWaveIcon } from "@/components/icons";
import { AnimatedDialogContent } from "@/components/ui/animated-dialog-content";
import { cn } from "@/lib/utils";
import { SubjectsDrawer } from "../drawers/subjects-drawer";

interface SearchInputProps {
	value: string;
	onChange: (value: string) => void;
}

export function SearchInput({ value, onChange }: SearchInputProps) {
	const [isFocused, setIsFocused] = useState(false);
	const [voicePressed, setVoicePressed] = useState(false);

	return (
		<div
			className={cn(
				"bg-secondary/60 dark:bg-secondary/40 rounded-2xl p-4 animate-fade-in-up delay-400 transition-all duration-300 border border-border/30",
				isFocused && "ring-2 ring-primary/20 border-primary/30",
			)}
		>
			<input
				type="text"
				placeholder="Ask anything about your studies..."
				value={value}
				onChange={(e) => onChange(e.target.value)}
				onFocus={() => setIsFocused(true)}
				onBlur={() => setIsFocused(false)}
				className="w-full bg-transparent text-foreground placeholder:text-muted-foreground/60 text-sm outline-none mb-4 input-focus rounded-md font-medium"
			/>

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
					<SubjectsDrawer>
						<button className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center hover:bg-muted transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background toolbutton">
							<Book className="w-4 h-4 text-muted-foreground toolbutton-icon" />
						</button>
					</SubjectsDrawer>
				</div>

				<div className="flex items-center gap-2">
					<AnimatedDialogContent>
						<span className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center hover:bg-muted transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background toolbutton cursor-pointer">
							<Mic className="w-4 h-4 text-muted-foreground toolbutton-icon" />
						</span>
					</AnimatedDialogContent>
					<button
						className={cn(
							"w-9 h-9 rounded-lg bg-primary flex items-center justify-center hover:opacity-90 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background voice-btn",
							voicePressed && "voice-btn-pressed",
						)}
						aria-label="Voice input"
						onClick={() => {
							setVoicePressed(true);
							setTimeout(() => setVoicePressed(false), 300);
						}}
					>
						<VoiceWaveIcon
							className={cn(
								"w-4 h-4 text-primary-foreground voice-btn-icon",
								voicePressed && "scale-125",
							)}
						/>
					</button>
				</div>
			</div>
		</div>
	);
}
