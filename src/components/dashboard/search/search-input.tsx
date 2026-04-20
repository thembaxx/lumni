"use client";

import { Book, Car, Mic, Plus } from "lucide-react";
import { useState } from "react";
import { VoiceWaveIcon } from "@/components/icons";
import { Drawer, DrawerTrigger } from "@/components/ui/drawer";
import { SubjectsDrawer } from "../drawers/subjects-drawer";

interface SearchInputProps {
	value: string;
	onChange: (value: string) => void;
}

export function SearchInput({ value, onChange }: SearchInputProps) {
	return (
		<div className="bg-secondary/60 rounded-2xl p-3 animate-fade-in-up delay-400">
			<input
				type="text"
				placeholder="Ask anything..."
				value={value}
				onChange={(e) => onChange(e.target.value)}
				className="w-full bg-transparent text-foreground placeholder-muted-foreground text-base outline-none mb-3 input-focus rounded-md"
			/>

			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<button
						className="w-9 h-9 rounded-full bg-muted/80 flex items-center justify-center hover:bg-muted transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background btn-ghost-hover"
						aria-label="Add attachment"
					>
						<Plus className="w-5 h-5 text-muted-foreground transition-transform duration-200" />
					</button>
					<SubjectsDrawer>
						<button className="w-9 h-9 rounded-full bg-muted/80 flex items-center justify-center hover:bg-muted transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background btn-ghost-hover">
							<Book className="w-5 h-5 text-muted-foreground transition-transform duration-200" />
						</button>
					</SubjectsDrawer>
				</div>

				<div className="flex items-center gap-2">
					<button
						className="w-9 h-9 rounded-full bg-muted/80 flex items-center justify-center hover:bg-muted transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background btn-ghost-hover"
						aria-label="Settings"
					>
						<Car className="w-5 h-5 text-muted-foreground transition-transform duration-200" />
					</button>
					<button
						className="w-9 h-9 rounded-full bg-muted/80 flex items-center justify-center hover:bg-muted transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background btn-ghost-hover"
						aria-label="Mute"
					>
						<Mic className="w-5 h-5 text-muted-foreground transition-transform duration-200" />
					</button>
					<button
						className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center hover:bg-teal-400 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background animate-breathe"
						aria-label="Voice input"
					>
						<VoiceWaveIcon className="w-5 h-5 text-zinc-900" />
					</button>
				</div>
			</div>
		</div>
	);
}
