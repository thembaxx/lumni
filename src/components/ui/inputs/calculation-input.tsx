"use client";

import { ArrowDown01Icon, ArrowUp01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface CalculationInputProps {
	value?: string;
	onChange?: (value: string) => void;
	onSubmit?: (value: string) => void;
	workingValue?: string;
	onWorkingChange?: (value: string) => void;
	unit?: string;
	onUnitChange?: (value: string) => void;
	disabled?: boolean;
}

export function CalculationInput({
	value = "",
	onChange = () => {},
	workingValue = "",
	onWorkingChange,
	unit,
	onUnitChange,
	disabled,
	onSubmit,
}: CalculationInputProps) {
	const [showWorking, setShowWorking] = useState(false);

	return (
		<div className="flex flex-col gap-3">
			<div className="flex items-center gap-3">
				<Label>Answer:</Label>
				<Input
					value={value}
					onChange={(e) => onChange(e.target.value)}
					disabled={disabled}
					placeholder="Enter your answer..."
					className="max-w-48"
				/>
				{unit && <span className="text-muted-foreground text-sm">{unit}</span>}
				{onUnitChange && (
					<Input
						value={unit || ""}
						onChange={(e) => onUnitChange(e.target.value)}
						disabled={disabled}
						placeholder="Unit"
						className="w-20"
					/>
				)}
			</div>
			{onWorkingChange && (
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={() => setShowWorking(!showWorking)}
					disabled={disabled}
					className="text-xs"
				>
					{showWorking ? (
						<HugeiconsIcon icon={ArrowUp01Icon} data-icon="inline-start" />
					) : (
						<HugeiconsIcon icon={ArrowDown01Icon} data-icon="inline-start" />
					)}
					Show working
				</Button>
			)}
			{showWorking && onWorkingChange && (
				<Textarea
					value={workingValue}
					onChange={(e) => onWorkingChange(e.target.value)}
					disabled={disabled}
					placeholder="Show your working steps..."
					className="min-h-[100px]"
				/>
			)}
			{onSubmit && (
				<Button
					onClick={() => onSubmit(value.trim())}
					disabled={disabled || !value.trim()}
					size="sm"
				>
					Submit Answer
				</Button>
			)}
		</div>
	);
}
