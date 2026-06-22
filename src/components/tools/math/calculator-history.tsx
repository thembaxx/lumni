"use client";

import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";

interface HistoryPanelProps {
	show: boolean;
	history: string[];
	onSelectResult: (result: string) => void;
}

export function HistoryPanel({
	show,
	history,
	onSelectResult,
}: HistoryPanelProps) {
	return (
		<AnimatePresence mode="wait" initial={false}>
			{show && (
				<m.div
					initial={{ opacity: 0, height: 0 }}
					animate={{ opacity: 1, height: "auto" }}
					exit={{ opacity: 0, height: 0 }}
					className="mb-3 overflow-hidden"
				>
					<div className="flex max-h-32 flex-col gap-1 overflow-y-auto rounded-xl border border-border/50 bg-system-surface p-3">
						{history.length === 0 && (
							<p className="py-2 text-center text-muted-foreground/40 text-xs">
								No history yet
							</p>
						)}
						{history.map((entry) => (
							<button
								type="button"
								key={`hist-${entry}`}
								onClick={() => onSelectResult(entry)}
								className="w-full cursor-pointer py-0.5 text-left font-mono text-muted-foreground/60 text-xs transition-colors hover:text-muted-foreground"
							>
								{entry}
							</button>
						))}
					</div>
				</m.div>
			)}
		</AnimatePresence>
	);
}
