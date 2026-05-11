"use client";

import { Textarea } from "@/components/ui/textarea";

interface EssayInputProps {
  value: string | undefined;
  onChange: (value: string) => void;
  disabled?: boolean;
  wordLimit?: number;
}

export function EssayInput({
  value = "",
  onChange,
  disabled,
  wordLimit,
}: EssayInputProps) {
  const wordCount = value ? value.trim().split(/\s+/).filter(Boolean).length : 0;

  return (
    <div className="space-y-2">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Write your essay here..."
        className="min-h-[250px]"
      />
      <div className="flex gap-3 text-xs text-muted-foreground">
        <span>Words: {wordCount}</span>
        {wordLimit !== undefined && (
          <span
            className={
              wordCount > wordLimit ? "text-destructive font-medium" : ""
            }
          >
            Limit: {wordLimit}
          </span>
        )}
      </div>
    </div>
  );
}
