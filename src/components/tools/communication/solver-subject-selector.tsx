"use client";

import { cn } from "@/lib/utils";

const SUBJECTS = [
  { id: "general", label: "General" },
  { id: "pre-algebra", label: "Pre-Algebra" },
  { id: "algebra", label: "Algebra" },
  { id: "trigonometry", label: "Trigonometry" },
  { id: "calculus", label: "Calculus" },
  { id: "geometry", label: "Geometry" },
  { id: "statistics", label: "Statistics" },
  { id: "matrix", label: "Matrix" },
] as const;

export type Subject = (typeof SUBJECTS)[number]["id"];

interface SolverSubjectSelectorProps {
  subject: Subject;
  onChange: (subject: Subject) => void;
}

export function SolverSubjectSelector({ subject, onChange }: SolverSubjectSelectorProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {SUBJECTS.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => onChange(s.id)}
          className={cn(
            "relative h-7 rounded-lg border px-2.5 font-medium text-xs transition-colors after:absolute after:-inset-2",
            subject === s.id
              ? "border-(--system-accent) bg-(--system-accent) text-system-accent-foreground"
              : "border-border bg-system-fill text-(--system-text-secondary) hover:border-(--system-accent)/40",
          )}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
