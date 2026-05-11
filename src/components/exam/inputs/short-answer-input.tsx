"use client";

import { Input } from "@/components/ui/input";

interface ShortAnswerInputProps {
	value: string | undefined;
	onChange: (value: string) => void;
	disabled?: boolean;
	maxLength?: number;
}

export function ShortAnswerInput({
	value = "",
	onChange,
	disabled,
	maxLength,
}: ShortAnswerInputProps) {
	return (
		<Input
			value={value}
			onChange={(e) => onChange(e.target.value)}
			disabled={disabled}
			maxLength={maxLength}
			placeholder="Type your answer..."
			className="max-w-md"
		/>
	);
}
