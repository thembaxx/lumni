"use client";

import { Tag01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/shared";

interface TagInputProps extends React.ComponentProps<"div"> {
	tags: string[];
	onAdd: (tag: string) => void;
	onRemove: (tag: string) => void;
}

export function TagInput({
	tags,
	onAdd,
	onRemove,
	className,
	...props
}: TagInputProps) {
	const [input, setInput] = useState("");

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter" && input.trim()) {
			e.preventDefault();
			onAdd(input.trim());
			setInput("");
		}
	};

	return (
		<div className={cn("flex flex-col gap-2", className)} {...props}>
			<div className="flex flex-wrap gap-2">
				{tags.map((tag) => (
					<span
						key={tag}
						className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 font-medium text-secondary-foreground text-xs"
					>
						<HugeiconsIcon icon={Tag01Icon} size={12} />
						{tag}
						<Button
							variant="ghost"
							size="icon-xs"
							className="size-4 hover:bg-transparent"
							onClick={() => onRemove(tag)}
							aria-label={`Remove tag ${tag}`}
						>
							×
						</Button>
					</span>
				))}
			</div>
			<Input
				placeholder="Add a tag and press Enter"
				value={input}
				onChange={(e) => setInput(e.target.value)}
				onKeyDown={handleKeyDown}
				className="h-9 text-sm"
			/>
		</div>
	);
}
