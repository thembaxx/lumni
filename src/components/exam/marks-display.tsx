"use client";

interface MarksDisplayProps {
  marks?: number | string | null;
  className?: string;
}

export function MarksDisplay({ marks, className = "" }: MarksDisplayProps) {
  if (marks === null || marks === undefined) return null;

  const display = typeof marks === "number" ? `(${marks})` : `(${marks})`;

  return (
    <span
      className={`inline-flex items-center text-xs font-medium text-muted-foreground ${className}`}
    >
      {display}
    </span>
  );
}
