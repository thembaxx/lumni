"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

interface SegmentedControlProps {
	value: string;
	onValueChange: (value: string) => void;
	items: { value: string; label: string }[];
	className?: string;
}

function SegmentedControl({
	value,
	onValueChange,
	items,
	className,
}: SegmentedControlProps) {
	return (
		<div
			role="radiogroup"
			className={cn(
				"inline-flex items-center rounded-[10px] bg-[--system-surface-secondary] p-[3px]",
				className,
			)}
		>
			{items.map((item) => (
				<button
					key={item.value}
					role="radio"
					aria-checked={value === item.value}
					onClick={() => onValueChange(item.value)}
					className={cn(
						"flex-1 rounded-[7px] px-4 py-2 text-sm font-medium whitespace-nowrap transition-[background-color,color,box-shadow] duration-150 ease-out",
						value === item.value
							? "bg-[--system-surface] text-[--system-accent] shadow-[--shadow-level-1]"
							: "text-[--system-text-secondary] hover:text-[--system-text-primary]",
					)}
				>
					{item.label}
				</button>
			))}
		</div>
	);
}

export { SegmentedControl };
