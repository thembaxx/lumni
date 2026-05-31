"use client";

import { m } from "framer-motion";
import { iOSEase } from "@/lib/utils/animation";

interface StepIndicatorProps {
	step: number;
	totalSteps: number;
}

export function StepIndicator({ step, totalSteps }: StepIndicatorProps) {
	return (
		<div className="mb-8 flex items-center gap-2">
			{Array.from({ length: totalSteps }, (_, i) => (
				<m.div
					// biome-ignore lint/suspicious/noArrayIndexKey: fixed-length, no reordering
					key={i}
					className={`h-1 flex-1 rounded-full ${
						i <= step ? "bg-[--system-accent]" : "bg-[--system-separator]"
					}`}
					animate={{
						backgroundColor:
							i <= step ? "var(--system-accent)" : "var(--system-separator)",
					}}
					transition={{
						duration: 0.4,
						ease: iOSEase,
						delay: i <= step ? (step - i) * 0.04 : 0,
					}}
				/>
			))}
		</div>
	);
}
