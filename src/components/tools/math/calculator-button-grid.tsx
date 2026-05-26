"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/shared";
import { ROWS, VARIANT_CLASSES } from "./calculator-layout";

interface ButtonGridProps {
	onButtonClick: (id: string) => void;
}

export function ButtonGrid({ onButtonClick }: ButtonGridProps) {
	return (
		<div className="flex flex-1 flex-col gap-1.5">
			{ROWS.map((row, rowIndex) => (
				<div
					// biome-ignore lint/suspicious/noArrayIndexKey: static keyboard rows
					key={rowIndex}
					className="grid flex-none grid-cols-5 gap-1.5"
				>
					{row.map((btn) => (
						<Button
							key={btn.id}
							variant={btn.variant}
							size="sm"
							onClick={() => onButtonClick(btn.id)}
							className={cn(
								"h-9 rounded-lg font-mono text-sm transition-transform active:scale-[0.96]",
								VARIANT_CLASSES[btn.variant],
							)}
						>
							{btn.label}
						</Button>
					))}
				</div>
			))}
		</div>
	);
}
