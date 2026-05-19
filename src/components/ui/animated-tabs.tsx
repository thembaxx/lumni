"use client";

import { m } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { Anim } from "@/components/shared/anim";
import { cn } from "@/lib/shared";

interface TabConfig {
	value: string;
	label: string;
	icon?: React.ReactNode;
}

interface AnimatedTabsProps {
	tabs: TabConfig[];
	value: string;
	onValueChange: (value: string) => void;
	className?: string;
	listClassName?: string;
	children?: React.ReactNode;
}

function AnimatedTabs({
	tabs,
	value,
	onValueChange,
	className,
	listClassName,
	children,
}: AnimatedTabsProps) {
	const listRef = useRef<HTMLDivElement>(null);
	const [indicator, setIndicator] = useState({ left: 0, width: 0 });

	const measure = useCallback(() => {
		if (!listRef.current) return;
		const buttons =
			listRef.current.querySelectorAll<HTMLButtonElement>("button[data-tab]");
		const activeIndex = tabs.findIndex((t) => t.value === value);
		const btn = buttons[activeIndex];
		if (!btn) return;
		const listRect = listRef.current.getBoundingClientRect();
		const btnRect = btn.getBoundingClientRect();
		setIndicator({
			left: btnRect.left - listRect.left,
			width: btnRect.width,
		});
	}, [tabs, value]);

	useEffect(() => {
		requestAnimationFrame(measure);
	}, [measure]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			const currentIndex = tabs.findIndex((t) => t.value === value);
			let nextIndex: number | null = null;
			if (e.key === "ArrowRight") {
				nextIndex = (currentIndex + 1) % tabs.length;
			} else if (e.key === "ArrowLeft") {
				nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
			}
			if (nextIndex !== null) {
				e.preventDefault();
				onValueChange(tabs[nextIndex].value);
			}
		},
		[tabs, value, onValueChange],
	);

	return (
		<Anim>
			<div className={cn("flex flex-col gap-2", className)}>
				<div
					ref={listRef}
					role="tablist"
					onKeyDown={handleKeyDown}
					className={cn(
						"relative inline-flex gap-1 p-1 rounded-lg bg-muted",
						listClassName,
					)}
				>
					{tabs.map((tab) => (
						<button
							key={tab.value}
							data-tab
							type="button"
							role="tab"
							aria-selected={value === tab.value}
							aria-controls={`tabpanel-${tab.value}`}
							onClick={() => onValueChange(tab.value)}
							className={cn(
								"relative z-10 inline-flex items-center justify-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors duration-150",
								value === tab.value
									? "text-background"
									: "text-muted-foreground hover:text-foreground",
							)}
						>
							{tab.icon}
							{tab.label}
						</button>
					))}
					<m.div
						className="absolute inset-y-1 bg-[--system-accent] rounded-md z-0"
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
				{value && children}
			</div>
		</Anim>
	);
}

export { AnimatedTabs };
