"use client";

import {
	Book01Icon,
	Camera01FreeIcons,
	Mic01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
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
				"animate-fade-in-up rounded-2xl border border-border/30 bg-secondary/60 p-4 transition-colors delay-400 duration-300",
				isFocused &&
					"border-[--system-accent]/30 ring-2 ring-[--system-accent]/20",
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
				className="mb-4 border-0 bg-transparent p-0 text-foreground shadow-none placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-system-accent/30"
			/>

			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Button
						variant="ghost"
						size="icon"
						aria-label="Search by image"
						className="toolbutton bg-muted/60 hover:bg-muted"
					>
						<HugeiconsIcon
							icon={Camera01FreeIcons}
							className="toolbutton-icon text-muted-foreground"
							data-icon
						/>
					</Button>
					<SubjectsDrawer>
						<Button
							variant="ghost"
							size="icon"
							aria-label="Select subject"
							className="toolbutton bg-muted/60 hover:bg-muted"
						>
							<HugeiconsIcon
								icon={Book01Icon}
								className="toolbutton-icon text-muted-foreground"
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
							className="toolbutton cursor-pointer bg-muted/60 hover:bg-muted"
						>
							<HugeiconsIcon
								icon={Mic01Icon}
								className="toolbutton-icon text-muted-foreground"
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
