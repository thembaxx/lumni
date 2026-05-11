"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface CalculationInputProps {
	answerValue: string;
	workingValue: string;
	onAnswerChange: (value: string) => void;
	onWorkingChange: (value: string) => void;
	disabled?: boolean;
}

export function CalculationInput({
	answerValue = "",
	workingValue = "",
	onAnswerChange,
	onWorkingChange,
	disabled,
}: CalculationInputProps) {
	const [showWorking, setShowWorking] = useState(false);

	return (
		<div className="space-y-3">
			<div className="flex items-center gap-3">
				<label className="text-sm font-medium">Answer:</label>
				<Input
					value={answerValue}
					onChange={(e) => onAnswerChange(e.target.value)}
					disabled={disabled}
					placeholder="Enter your answer..."
					className="max-w-[200px]"
				/>
			</div>
			<Button
				type="button"
				variant="ghost"
				size="sm"
				onClick={() => setShowWorking(!showWorking)}
				disabled={disabled}
				className="text-xs"
			>
				{showWorking ? (
					<ChevronUp className="w-3 h-3 mr-1" />
				) : (
					<ChevronDown className="w-3 h-3 mr-1" />
				)}
				Show working
			</Button>
			{showWorking && (
				<Textarea
					value={workingValue}
					onChange={(e) => onWorkingChange(e.target.value)}
					disabled={disabled}
					placeholder="Show your working steps..."
					className="min-h-[100px]"
				/>
			)}
		</div>
	);
}
