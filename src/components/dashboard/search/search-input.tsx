"use client";

import { Book01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
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
			</div>
		</div>
	);
}
