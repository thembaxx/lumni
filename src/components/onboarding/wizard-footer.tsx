"use client";

import ArrowLeft01Icon from "@hugeicons/core-free-icons/ArrowLeft01Icon";
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";

interface WizardFooterProps {
  step: number;
  totalSteps: number;
  canProceed: boolean;
  isCompleting: boolean;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
  ctaLabel: string;
}

export function WizardFooter({
  step,
  totalSteps,
  canProceed,
  isCompleting,
  onBack,
  onNext,
  onSkip,
  ctaLabel,
}: WizardFooterProps) {
  return (
    <div className="flex items-center justify-between border-border/40 border-t pt-4">
      <div>
        {step > 0 && step < totalSteps - 1 && (
          <Button variant="ghost" onClick={onBack}>
            <HugeiconsIcon icon={ArrowLeft01Icon} data-icon="inline-start" />
            Back
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2">
        {step < totalSteps - 1 && (
          <Button variant="ghost" onClick={onSkip} disabled={isCompleting}>
            Skip
          </Button>
        )}
        <Button onClick={onNext} disabled={!canProceed || isCompleting}>
          {ctaLabel}
          <HugeiconsIcon icon={ArrowRight01Icon} data-icon="inline-end" />
        </Button>
      </div>
    </div>
  );
}
