"use client";

import { m } from "framer-motion";
import { Anim } from "@/components/shared/anim";
import { useCallback, useEffect, useRef, useState } from "react";

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
	const listRef = useRef<HTMLDivElement>(null);
	const [indicator, setIndicator] = useState({ left: 0, width: 0 });

	const measure = useCallback(() => {
		if (!listRef.current) return;
		const buttons =
			listRef.current.querySelectorAll<HTMLButtonElement>("button");
		const activeIndex = items.findIndex((item) => item.value === value);
		const btn = buttons[activeIndex];
		if (!btn) return;
		const listRect = listRef.current.getBoundingClientRect();
		const btnRect = btn.getBoundingClientRect();
		setIndicator({
			left: btnRect.left - listRect.left,
			width: btnRect.width,
		});
	}, [items, value]);

	useEffect(() => {
		requestAnimationFrame(measure);
	}, [measure]);

	return (
		<Anim>
			<div
				ref={listRef}
				role="radiogroup"
				className={cn(
					"relative inline-flex items-center rounded-[10px] bg-[--system-surface-secondary] p-[3px]",
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
							"relative z-10 flex-1 rounded-[7px] px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors duration-150",
							value === item.value
								? "text-[--system-accent]"
								: "text-[--system-text-secondary] hover:text-[--system-text-primary]",
						)}
					>
						{item.label}
					</button>
				))}
				<m.div
					className="absolute inset-y-[3px] z-0 rounded-[7px] bg-[--system-surface] shadow-[--shadow-level-1]"
					initial={false}
					animate={{
						left: indicator.left,
						width: indicator.width,
					}}
					transition={{
						type: "spring",
						stiffness: 400,
						damping: 30,
					}}
				/>
			</div>
		</Anim>
	);
}

export { SegmentedControl };
