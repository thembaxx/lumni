"use client";

import { Input } from "@/components/ui/input";

interface ComprehensionBlankProps {
  sentenceTemplate?: string;
  value: string;
  disabled: boolean;
  questionNumber: number;
  onChange: (value: string) => void;
}

export function ComprehensionBlank({
  sentenceTemplate,
  value,
  disabled,
  questionNumber,
  onChange,
}: ComprehensionBlankProps) {
  const blank = (
    <span className="mx-1 inline-block rounded-md bg-(--system-accent)/15 px-2 py-0.5 font-semibold text-(--system-accent)">
      ______
    </span>
  );

  return (
    <div className="flex flex-col gap-2">
      {sentenceTemplate && (
        <div className="rounded-xl bg-muted/30 p-3 text-sm leading-relaxed">
          {sentenceTemplate.split("___").map((part, i, arr) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static split array, never reordered
            <span key={i}>
              {part}
              {i < arr.length - 1 && blank}
            </span>
          ))}
        </div>
      )}
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Type the missing word..."
        className="rounded-xl text-base"
        aria-label={`Fill in the blank for question ${questionNumber}`}
      />
    </div>
  );
}
