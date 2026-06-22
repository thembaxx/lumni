"use client";

import { useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { iOSDecelerate } from "@/lib/utils/animation";

interface ChallengeDialogProps {
  open: boolean;
  onClose: () => void;
  layoutId: string;
  children: React.ReactNode;
  className?: string;
}

export function ChallengeDialog({ open, onClose, children, className }: ChallengeDialogProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        showCloseButton={false}
        className={className ?? "rounded-2xl p-0 ring-1 ring-foreground/10 sm:max-w-md"}
      >
        <m.div
          initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2, ease: iOSDecelerate }}
        >
          {children}
        </m.div>
      </DialogContent>
    </Dialog>
  );
}
