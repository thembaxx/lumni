"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { SM2_QUALITIES } from "@/lib/flashcard-engine";
import { cn } from "@/lib/shared";

interface QualityPickerProps {
	polarity: "correct" | "incorrect";
	onSelect: (quality: number) => void;
	onTimeout: () => void;
}

export function QualityPicker({
	polarity,
	onSelect,
	onTimeout,
}: QualityPickerProps) {
	const [selected, setSelected] = useState<number | null>(null);
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const onTimeoutEvent = useEffectEvent(onTimeout);

	const qualities =
		polarity === "correct"
			? SM2_QUALITIES.slice(3).reverse()
			: SM2_QUALITIES.slice(0, 3).reverse();

	useEffect(() => {
		const id = setTimeout(() => {
			if (selected === null) {
				onTimeoutEvent();
			}
		}, 1500);
		timerRef.current = id;

		return () => clearTimeout(id);
	}, [selected]);

	function handleSelect(quality: number) {
		if (selected !== null) return;
		setSelected(quality);
		if (timerRef.current) clearTimeout(timerRef.current);
		timerRef.current = setTimeout(() => onSelect(quality), 200);
	}

	return (
		<div className="flex flex-col items-center gap-3">
			<p className="text-muted-foreground text-xs">
				{polarity === "correct"
					? "How well did you know it?"
					: "How much did you struggle?"}
			</p>
			<div className="flex gap-2">
				{qualities.map((q) => (
					<button
						key={q.quality}
						type="button"
						onClick={() => handleSelect(q.quality)}
						className={cn(
							"flex flex-col items-center gap-0.5 rounded-xl border px-4 py-2 text-xs transition-all duration-200",
							polarity === "correct"
								? "border-success/30 text-success hover:bg-success/10"
								: "border-destructive/30 text-destructive hover:bg-destructive/10",
							selected === q.quality &&
								(polarity === "correct"
									? "bg-success/20 ring-2 ring-success/50"
									: "bg-destructive/20 ring-2 ring-destructive/50"),
							selected !== null && selected !== q.quality && "opacity-30",
						)}
					>
						<span className="font-medium">{q.label}</span>
						<span className="ios-caption-3 opacity-60">{q.description}</span>
					</button>
				))}
			</div>
		</div>
	);
}
