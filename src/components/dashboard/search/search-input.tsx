"use client";

import { Camera01FreeIcons } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Book, Mic } from "lucide-react";
import { useState } from "react";
import { VoiceWaveIcon } from "@/components/icons";
import { AnimatedDialogContent } from "@/components/ui/animated-dialog-content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/shared";
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
				"bg-secondary/60 rounded-2xl p-4 animate-fade-in-up delay-400 transition-colors duration-300 border border-border/30",
				isFocused &&
					"ring-2 ring-[--system-accent]/20 border-[--system-accent]/30",
			)}
		>
			<Input
				type="text"
				placeholder="Ask anything about your studies..."
				aria-label="Ask anything about your studies"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				onFocus={() => setIsFocused(true)}
				onBlur={() => setIsFocused(false)}
				className="bg-transparent text-foreground placeholder:text-muted-foreground/60 text-sm mb-4 shadow-none border-0 p-0 focus-visible:ring-2 focus-visible:ring-system-accent/30"
			/>

			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Button
						variant="ghost"
						size="icon"
						className="bg-muted/60 hover:bg-muted toolbutton"
					>
						<HugeiconsIcon
							icon={Camera01FreeIcons}
							className="text-muted-foreground toolbutton-icon"
							data-icon
						/>
					</Button>
					<SubjectsDrawer>
						<Button
							variant="ghost"
							size="icon"
							className="bg-muted/60 hover:bg-muted toolbutton"
						>
							<Book
								className="text-muted-foreground toolbutton-icon"
								data-icon
							/>
						</Button>
					</SubjectsDrawer>
				</div>

				<div className="flex items-center gap-2">
					<AnimatedDialogContent>
						<Button
							variant="ghost"
							size="icon"
							className="bg-muted/60 hover:bg-muted toolbutton cursor-pointer"
						>
							<Mic
								className="text-muted-foreground toolbutton-icon"
								data-icon
							/>
						</Button>
					</AnimatedDialogContent>
					<Button
						variant="default"
						size="icon"
						className={cn("voice-btn", voicePressed && "voice-btn-pressed")}
						aria-label="Voice input"
						onClick={() => {
							setVoicePressed(true);
							setTimeout(() => setVoicePressed(false), 300);
						}}
					>
						<VoiceWaveIcon
							className={cn("voice-btn-icon", voicePressed && "scale-125")}
							data-icon
						/>
					</Button>
				</div>
			</div>
		</div>
	);
}
