"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CalculationInputProps {
	unit: string;
	onSubmit: (answer: { value: number; unit: string }) => void;
	disabled?: boolean;
}

export function CalculationInput({ unit, onSubmit, disabled }: CalculationInputProps) {
	const [value, setValue] = useState("");
	const [enteredUnit, setEnteredUnit] = useState(unit);

	return (
		<div className="space-y-3">
			<div className="flex gap-2">
				<Input
					type="number"
					step="any"
					value={value}
					onChange={(e) => setValue(e.target.value)}
					placeholder="Enter numeric value..."
					disabled={disabled}
					className="flex-1"
				/>
				<Input
					value={enteredUnit}
					onChange={(e) => setEnteredUnit(e.target.value)}
					placeholder="Unit"
					disabled={disabled}
					className="w-24"
				/>
			</div>
			<div className="flex justify-between items-center">
				<span className="text-xs text-muted-foreground">Expected unit: {unit}</span>
				<Button onClick={() => onSubmit({ value: parseFloat(value), unit: enteredUnit })} disabled={disabled || !value || isNaN(parseFloat(value))}>
					Submit Answer
				</Button>
			</div>
		</div>
	);
}
