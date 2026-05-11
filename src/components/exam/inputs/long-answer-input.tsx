"use client";

import { Textarea } from "@/components/ui/textarea";

interface LongAnswerInputProps {
  value: string | undefined;
  onChange: (value: string) => void;
  disabled?: boolean;
  minWords?: number;
  maxWords?: number;
}

export function LongAnswerInput({
  value = "",
  onChange,
  disabled,
  minWords,
  maxWords,
}: LongAnswerInputProps) {
  const wordCount = value ? value.trim().split(/\s+/).filter(Boolean).length : 0;

  return (
    <div className="space-y-2">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Type your answer..."
        className="min-h-[120px]"
      />
      <div className="flex gap-3 text-xs text-muted-foreground">
        <span>Words: {wordCount}</span>
        {minWords !== undefined && (
          <span className={wordCount < minWords ? "text-destructive" : ""}>
            Min: {minWords}
          </span>
        )}
        {maxWords !== undefined && (
          <span className={wordCount > maxWords ? "text-destructive" : ""}>
            Max: {maxWords}
          </span>
        )}
      </div>
    </div>
  );
}
