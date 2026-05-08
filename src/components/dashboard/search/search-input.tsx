"use client";

import { Camera01FreeIcons } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Book, Mic } from "lucide-react";
import { useState } from "react";
import { VoiceWaveIcon } from "@/components/icons";
import { AnimatedDialogContent } from "@/components/ui/animated-dialog-content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
			<Input
				type="text"
				placeholder="Ask anything about your studies..."
				value={value}
				onChange={(e) => onChange(e.target.value)}
				onFocus={() => setIsFocused(true)}
				onBlur={() => setIsFocused(false)}
				className="bg-transparent text-foreground placeholder:text-muted-foreground/60 text-sm outline-none mb-4 shadow-none border-0 p-0 focus-visible:ring-0"
			/>

			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Button
						variant="ghost"
						size="icon"
						className="w-8 h-8 bg-muted/60 hover:bg-muted toolbutton"
					>
						<HugeiconsIcon
							icon={Camera01FreeIcons}
							className="w-4 h-4 text-muted-foreground toolbutton-icon"
						/>
					</Button>
					<SubjectsDrawer>
						<Button
							variant="ghost"
							size="icon"
							className="w-8 h-8 bg-muted/60 hover:bg-muted toolbutton"
						>
							<Book className="w-4 h-4 text-muted-foreground toolbutton-icon" />
						</Button>
					</SubjectsDrawer>
				</div>

				<div className="flex items-center gap-2">
					<AnimatedDialogContent>
						<Button
							variant="ghost"
							size="icon"
							className="w-8 h-8 bg-muted/60 hover:bg-muted toolbutton cursor-pointer"
						>
							<Mic className="w-4 h-4 text-muted-foreground toolbutton-icon" />
						</Button>
					</AnimatedDialogContent>
					<Button
						variant="default"
						size="icon"
						className={cn(
							"w-9 h-9 voice-btn",
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
								"w-4 h-4 voice-btn-icon",
								voicePressed && "scale-125",
							)}
						/>
					</Button>
				</div>
			</div>
		</div>
	);
}
