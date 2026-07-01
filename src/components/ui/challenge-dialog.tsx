"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface ChallengeDialogProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export function ChallengeDialog({ open, onClose, children, className }: ChallengeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        showCloseButton={false}
        className={className ?? "rounded-2xl p-0 ring-1 ring-foreground/10 sm:max-w-md"}
      >
        <DialogTitle className="sr-only">Challenge</DialogTitle>
        <div>{children}</div>
      </DialogContent>
    </Dialog>
  );
}
