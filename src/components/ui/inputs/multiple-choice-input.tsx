"use client";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { Option } from "@/types/exam-paper";

interface MultipleChoiceInputProps {
	options: Option[];
	value: string | undefined;
	onChange: (value: string) => void;
	disabled?: boolean;
}

export function MultipleChoiceInput({
	options,
	value,
	onChange,
	disabled,
}: MultipleChoiceInputProps) {
	return (
		<RadioGroup
			value={value}
			onValueChange={onChange}
			disabled={disabled}
			className="flex flex-col gap-2"
		>
			{options.map((opt) => (
				<div key={opt.id} className="flex items-center gap-3">
					<RadioGroupItem value={opt.id} id={`mc-${opt.id}`} />
					<Label htmlFor={`mc-${opt.id}`} className="cursor-pointer text-sm">
						<span className="mr-1 font-medium">{opt.id}.</span>
						{opt.text}
					</Label>
				</div>
			))}
		</RadioGroup>
	);
}
