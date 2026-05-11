"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MatchingInputProps {
	leftItems: string[];
	rightItems: string[];
	onSubmit: (pairs: { left: string; right: string }[]) => void;
	disabled?: boolean;
}

export function MatchingInput({ leftItems, rightItems, onSubmit, disabled }: MatchingInputProps) {
	const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
	const [selectedRight, setSelectedRight] = useState<string | null>(null);
	const [pairs, setPairs] = useState<{ left: string; right: string }[]>([]);

	const handleLeftClick = useCallback((item: string) => {
		if (disabled) return;
		setSelectedLeft(item);
		if (selectedRight) {
			setPairs((prev) => [...prev, { left: item, right: selectedRight }]);
			setSelectedLeft(null);
			setSelectedRight(null);
		}
	}, [disabled, selectedRight]);

	const handleRightClick = useCallback((item: string) => {
		if (disabled) return;
		setSelectedRight(item);
		if (selectedLeft) {
			setPairs((prev) => [...prev, { left: selectedLeft, right: item }]);
			setSelectedLeft(null);
			setSelectedRight(null);
		}
	}, [disabled, selectedLeft]);

	const removePair = useCallback((index: number) => {
		setPairs((prev) => prev.filter((_, i) => i !== index));
	}, []);

	const remainingLeft = leftItems.filter((l) => !pairs.some((p) => p.left === l));
	const remainingRight = rightItems.filter((r) => !pairs.some((p) => p.right === r));

	return (
		<div className="space-y-4">
			<div className="flex gap-4">
				<div className="flex-1 space-y-2">
					<p className="text-sm font-medium">Items</p>
					{remainingLeft.map((item) => (
						<Button
							key={item}
							variant="outline"
							className={cn("w-full justify-start", selectedLeft === item && "ring-2 ring-primary")}
							onClick={() => handleLeftClick(item)}
							disabled={disabled}
						>
							{item}
						</Button>
					))}
				</div>
				<div className="flex-1 space-y-2">
					<p className="text-sm font-medium">Matches</p>
					{remainingRight.map((item) => (
						<Button
							key={item}
							variant="outline"
							className={cn("w-full justify-start", selectedRight === item && "ring-2 ring-primary")}
							onClick={() => handleRightClick(item)}
							disabled={disabled}
						>
							{item}
						</Button>
					))}
				</div>
			</div>
			{pairs.length > 0 && (
				<div className="space-y-1">
					<p className="text-sm font-medium">Your pairs:</p>
					{pairs.map((p, i) => (
						<div key={i} className="flex items-center gap-2 text-sm">
							<span>{p.left}</span>
							<span>→</span>
							<span>{p.right}</span>
							{!disabled && (
								<Button variant="ghost" size="sm" onClick={() => removePair(i)} className="h-6 px-2 text-xs">
									✕
								</Button>
							)}
						</div>
					))}
				</div>
			)}
			<Button onClick={() => onSubmit(pairs)} disabled={disabled || pairs.length !== leftItems.length} className="w-full">
				Submit Match
			</Button>
		</div>
	);
}
