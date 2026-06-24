"use client";

import { useState } from "react";
import { LessonLibrary } from "@/components/lesson";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function StudyPlanSheet() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="inline-flex h-11 items-center justify-center gap-2.5 rounded-lg border border-border/80 bg-secondary/60 px-5 text-foreground transition-colors hover:border-accent hover:bg-accent">
        <span className="text-(--system-accent)">
          <svg
            className="size-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <title>Study plan</title>
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </span>
        <span className="font-medium text-sm">Study Plan</span>
      </SheetTrigger>
      <SheetContent className="h-dvh w-full rounded-t-none px-4 sm:max-w-135" side="bottom">
        <SheetHeader className="text-left">
          <SheetTitle>Study Plan</SheetTitle>
          <SheetDescription>Personalized learning path based on your progress</SheetDescription>
        </SheetHeader>
        <div className="max-h-[95dvh] grow overflow-y-auto px-4 pb-4">
          <LessonLibrary />
        </div>
      </SheetContent>
    </Sheet>
  );
}
