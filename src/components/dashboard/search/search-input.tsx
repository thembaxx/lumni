"use client";

import { Book, Car, Mic, Plus } from "lucide-react";
import { useState } from "react";
import { VoiceWaveIcon } from "@/components/icons";
import { Drawer, DrawerTrigger } from "@/components/ui/drawer";
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
				"bg-secondary/60 dark:bg-secondary/40 rounded-2xl p-3 animate-fade-in-up delay-400 transition-all duration-300",
				isFocused && "ring-2 ring-primary/20",
			)}
		>
			<input
				type="text"
				placeholder="Ask anything..."
				value={value}
				onChange={(e) => onChange(e.target.value)}
				onFocus={() => setIsFocused(true)}
				onBlur={() => setIsFocused(false)}
				className="w-full bg-transparent text-foreground placeholder:text-muted-foreground/70 text-base outline-none mb-3 input-focus rounded-md"
			/>

			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<button
						className="w-9 h-9 rounded-full bg-muted/80 flex items-center justify-center hover:bg-muted transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background btn-ghost-hover"
						aria-label="Add attachment"
					>
						<Plus className="w-5 h-5 text-muted-foreground transition-transform duration-200 group-hover:scale-110" />
					</button>
					<SubjectsDrawer>
						<button className="w-9 h-9 rounded-full bg-muted/80 flex items-center justify-center hover:bg-muted transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background btn-ghost-hover">
							<Book className="w-5 h-5 text-muted-foreground transition-transform duration-200 group-hover:scale-110" />
						</button>
					</SubjectsDrawer>
				</div>

				<div className="flex items-center gap-2">
					<button
						className="w-9 h-9 rounded-full bg-muted/80 flex items-center justify-center hover:bg-muted transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background btn-ghost-hover"
						aria-label="Settings"
					>
						<Car className="w-5 h-5 text-muted-foreground transition-transform duration-200 group-hover:scale-110" />
					</button>
					<button
						className="w-9 h-9 rounded-full bg-muted/80 flex items-center justify-center hover:bg-muted transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background btn-ghost-hover"
						aria-label="Mute"
					>
						<Mic className="w-5 h-5 text-muted-foreground transition-transform duration-200 group-hover:scale-110" />
					</button>
					<button
						className="w-10 h-10 rounded-full bg-primary flex items-center justify-center hover:opacity-90 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background animate-breathe btn-ghost-hover"
						aria-label="Voice input"
						onClick={() => {
							setVoicePressed(true);
							setTimeout(() => setVoicePressed(false), 300);
						}}
					>
						<VoiceWaveIcon
							className={cn(
								"w-5 h-5 text-primary-foreground transition-all duration-200",
								voicePressed && "scale-125",
							)}
						/>
					</button>
				</div>
			</div>
		</div>
	);
}
