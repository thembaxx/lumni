"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, GraduationCap } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StepByStepProps {
	steps: string[];
	className?: string;
}

export function StepByStep({ steps, className }: StepByStepProps) {
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
				<div className="flex items-center gap-2 text-sm font-semibold text-primary">
					<div className="bg-primary/10 p-1.5 rounded-full shadow-inner">
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
						className="h-8 w-8 hover:bg-primary/10 transition-colors"
					>
						<ChevronLeft className="w-4 h-4" />
					</Button>
					<Button
						variant="ghost"
						size="icon-sm"
						onClick={nextStep}
						disabled={currentStep === steps.length - 1}
						className="h-8 w-8 hover:bg-primary/10 bg-primary/5 transition-all active:scale-95"
					>
						<ChevronRight className="w-4 h-4" />
					</Button>
				</div>
			</div>

			<div className="relative overflow-hidden">
				<AnimatePresence mode="wait">
					<motion.div
						key={currentStep}
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -10 }}
						transition={{ duration: 0.3, ease: "easeOut" }}
						className="bg-card border border-primary/10 rounded-2xl p-6 shadow-sm relative group"
					>
						<div className="absolute top-0 left-0 w-1.5 h-full bg-primary/20 group-hover:bg-primary/40 transition-colors rounded-l-2xl" />
						<p className="text-sm leading-relaxed font-medium text-foreground/90">
							{steps[currentStep]}
						</p>
					</motion.div>
				</AnimatePresence>
			</div>

			<div className="flex gap-2 justify-center pt-1">
				{steps.map((_, idx) => (
					<button
						key={idx}
						type="button"
						onClick={() => setCurrentStep(idx)}
						className={cn(
							"h-1.5 rounded-full transition-all duration-300",
							idx === currentStep
								? "w-8 bg-primary shadow-sm shadow-primary/30"
								: "w-2 bg-muted-foreground/20 hover:bg-muted-foreground/40",
						)}
						aria-label={`Go to step ${idx + 1}`}
					/>
				))}
			</div>
		</div>
	);
}
