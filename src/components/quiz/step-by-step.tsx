"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, GraduationCap } from "lucide-react";
import { useState } from "react";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
		<div className={cn("space-y-4", className)}>
			<div className="flex items-center justify-between px-1">
				<div className="flex items-center gap-2 text-sm font-semibold text-foreground">
					<div className="bg-[--system-accent]/10 p-1.5 rounded-full shadow-inner">
						<GraduationCap className="w-4 h-4" />
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
						className="h-8 w-8 hover:bg-[--system-accent]/10 transition-colors"
					>
						<ChevronLeft className="w-4 h-4" />
					</Button>
					<Button
						variant="ghost"
						size="icon-sm"
						onClick={nextStep}
						disabled={currentStep === steps.length - 1}
						className="h-8 w-8 hover:bg-[--system-accent]/10 bg-[--system-accent]/5 transition-colors active:scale-[0.96]"
					>
						<ChevronRight className="w-4 h-4" />
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
						className="bg-card border border-[--system-accent]/10 rounded-2xl p-6 shadow-sm relative group"
					>
						<div className="absolute top-0 left-0 w-1.5 h-full bg-[--system-accent]/20 group-hover:bg-[--system-accent]/40 transition-colors rounded-l-2xl" />
						<div className="text-sm leading-relaxed font-medium text-foreground/90">
							<MarkdownRenderer
								content={steps[currentStep]}
								subject={subject}
							/>
						</div>
					</motion.div>
				</AnimatePresence>
			</div>

			<div className="flex gap-2 justify-center pt-1">
				{steps.map((_, idx) => (
					<Button
						key={idx}
						type="button"
						variant="ghost"
						onClick={() => setCurrentStep(idx)}
						className={cn(
							"h-1.5 rounded-full p-0 min-h-0",
							idx === currentStep
								? "w-8 bg-[--system-accent] shadow-sm shadow-[--system-accent]/30"
								: "w-2 bg-muted-foreground/20 hover:bg-muted-foreground/40",
						)}
						aria-label={`Go to step ${idx + 1}`}
					/>
				))}
			</div>
		</div>
	);
}
