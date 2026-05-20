"use client";

import {
	ArrowLeft01Icon,
	ArrowRight01Icon,
	Mortarboard01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/shared";

interface StepByStepProps {
	steps: string[];
	subject?: string;
	className?: string;
}

export function StepByStep({ steps, subject, className }: StepByStepProps) {
	const [currentStep, setCurrentStep] = useState(0);

	if (!steps || steps.length === 0) return null;

	const nextStep = () => {
		if (currentStep < steps.length - 1) {
			setCurrentStep(currentStep + 1);
		}
	};

	const prevStep = () => {
		if (currentStep > 0) {
			setCurrentStep(currentStep - 1);
		}
	};

	return (
		<div className={cn("flex flex-col gap-4", className)}>
			<div className="flex items-center justify-between px-1">
				<div className="flex items-center gap-2 font-semibold text-foreground text-sm">
					<div className="rounded-full bg-[--system-accent]/10 p-1.5">
						<HugeiconsIcon icon={Mortarboard01Icon} className="size-4" />
					</div>
					<span>
						Step {currentStep + 1} of {steps.length}
					</span>
				</div>
				<div className="flex gap-2">
					<Button
						variant="ghost"
						size="icon-sm"
						onClick={prevStep}
						disabled={currentStep === 0}
						className="size-8 hover:bg-[--system-accent]/10"
					>
						<HugeiconsIcon icon={ArrowLeft01Icon} data-icon="inline-start" />
					</Button>
					<Button
						variant="ghost"
						size="icon-sm"
						onClick={nextStep}
						disabled={currentStep === steps.length - 1}
						className="size-8 bg-[--system-accent]/5 hover:bg-[--system-accent]/10"
					>
						<HugeiconsIcon icon={ArrowRight01Icon} data-icon="inline-start" />
					</Button>
				</div>
			</div>

			<div className="relative overflow-hidden">
				<AnimatePresence mode="wait" initial={false}>
					<motion.div
						key={currentStep}
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -10 }}
						transition={{ duration: 0.3, ease: "easeOut" }}
						className="group relative rounded-2xl border border-[--system-accent]/10 bg-card p-6 shadow-sm"
					>
						<div className="absolute top-0 left-0 h-full w-1.5 rounded-l-2xl bg-[--system-accent]/20 transition-colors group-hover:bg-[--system-accent]/40" />
						<div className="font-medium text-foreground/90 text-sm leading-relaxed">
							<MarkdownRenderer
								content={steps[currentStep]}
								subject={subject}
							/>
						</div>
					</motion.div>
				</AnimatePresence>
			</div>

			<div className="flex justify-center gap-2 pt-1">
				{steps.map((_step, idx) => (
					<Button
						// biome-ignore lint/suspicious/noArrayIndexKey: step dots are navigation indicators
						key={idx}
						type="button"
						variant="ghost"
						onClick={() => setCurrentStep(idx)}
						className={cn(
							"h-1.5 min-h-0 rounded-full p-0",
							idx === currentStep
								? "w-10 bg-[--system-accent] shadow-[--system-accent]/30 shadow-sm"
								: "w-2 bg-muted-foreground/20 hover:bg-muted-foreground/40",
						)}
						aria-label={`Go to step ${idx + 1}`}
					/>
				))}
			</div>
		</div>
	);
}
