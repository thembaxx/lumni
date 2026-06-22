"use client";

import * as m from "motion/react-m";
import { cn } from "@/lib/utils";
import { iOSEase } from "@/lib/utils/animation";

interface StepIndicatorProps {
	step: number;
	totalSteps: number;
}

export function StepIndicator({ step, totalSteps }: StepIndicatorProps) {
	return (
		<progress
			className="flex flex-1 items-center gap-1.5"
			aria-valuenow={step + 1}
			aria-valuemin={1}
			aria-valuemax={totalSteps}
		>
			{Array.from({ length: totalSteps }, (_, i) => (
				<m.div
					// biome-ignore lint/suspicious/noArrayIndexKey: fixed-length, no reordering
					key={i}
					className={cn(
						"h-1.5 flex-1 rounded-full transition-shadow duration-300",
						i <= step ? "bg-[--system-accent]" : "bg-[--system-separator]",
					)}
					initial={false}
					animate={{
						backgroundColor:
							i <= step ? "var(--system-accent)" : "var(--system-separator)",
						scale: i === step ? [1, 1.08, 1] : 1,
					}}
					transition={{
						backgroundColor: {
							duration: 0.4,
							ease: iOSEase,
							delay: i <= step ? (step - i) * 0.04 : 0,
						},
						scale: {
							duration: 0.3,
							ease: iOSEase,
							delay: 0.1,
						},
					}}
				/>
			))}
		</progress>
	);
}
