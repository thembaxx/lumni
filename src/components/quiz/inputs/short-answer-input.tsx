"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ShortAnswerInputProps {
	maxLength: number;
	onSubmit: (answer: string) => void;
	disabled?: boolean;
}

export function ShortAnswerInput({
	maxLength,
	onSubmit,
	disabled,
}: ShortAnswerInputProps) {
	const [value, setValue] = useState("");

	return (
		<div className="space-y-3">
			<Input
				value={value}
				onChange={(e) => setValue(e.target.value.slice(0, maxLength))}
				placeholder="Type your answer..."
				disabled={disabled}
				className="w-full"
			/>
			<div className="flex items-center justify-between">
				<span className="text-xs text-muted-foreground">
					{value.length}/{maxLength} characters
				</span>
				<Button
					onClick={() => onSubmit(value.trim())}
					disabled={disabled || !value.trim()}
				>
					Submit Answer
				</Button>
			</div>
		</div>
	);
}
