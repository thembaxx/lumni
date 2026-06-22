"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface ShortAnswerInputProps {
  value?: string | undefined;
  onChange?: (value: string) => void;
  maxLength?: number;
  disabled?: boolean;
  onSubmit?: (value: string) => void;
}

export function ShortAnswerInput({
  value = "",
  onChange = () => {},
  maxLength,
  disabled,
  onSubmit,
}: ShortAnswerInputProps) {
  const charCount = value.length;

  return (
    <div className="flex flex-col gap-3">
      <Label htmlFor="short-answer-input">Your answer</Label>
      <Input
        id="short-answer-input"
        value={value}
        onChange={(e) => {
          const next = e.target.value;
          if (maxLength && next.length > maxLength) return;
          onChange(next);
        }}
        disabled={disabled}
        maxLength={maxLength}
        placeholder="Type your answer..."
        className={cn("max-w-md", onSubmit && "pr-24")}
      />
      <div className="flex items-center justify-between">
        {maxLength != null && maxLength > 0 && (
          <span
            className={cn(
              "text-xs",
              charCount >= maxLength ? "font-medium text-destructive" : "text-muted-foreground",
            )}
          >
            {charCount}/{maxLength} characters
          </span>
        )}
        {onSubmit && (
          <Button
            onClick={() => onSubmit(value.trim())}
            disabled={disabled || !value.trim()}
            size="sm"
          >
            Submit Answer
          </Button>
        )}
      </div>
    </div>
  );
}
