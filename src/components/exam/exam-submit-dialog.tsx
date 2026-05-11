"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ExamSubmitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  answeredCount: number;
  totalParts: number;
}

export function ExamSubmitDialog({
  open,
  onOpenChange,
  onConfirm,
  answeredCount,
  totalParts,
}: ExamSubmitDialogProps) {
  const unanswered = totalParts - answeredCount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit Exam</DialogTitle>
          <DialogDescription>
            Are you sure you want to submit your exam?
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Answered</span>
            <span className="font-medium">
              {answeredCount}/{totalParts}
            </span>
          </div>
          {unanswered > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-destructive">Unanswered</span>
              <span className="font-medium text-destructive">{unanswered}</span>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Continue Writing
          </Button>
          <Button
            variant={unanswered > 0 ? "destructive" : "default"}
            onClick={onConfirm}
          >
            Submit Exam
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
