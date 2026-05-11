"use client";

import type { ContentBlock, QuestionPart } from "@/types/exam-paper";
import { ContentBlockRenderer } from "@/components/exam/content-block-renderer";
import { PartRenderer } from "@/components/exam/part-renderer";

interface MixedInputProps {
  value: Record<string, string | string[]> | undefined;
  onChange: (partId: string, value: string | string[]) => void;
  disabled?: boolean;
  content?: ContentBlock[] | null;
  subParts?: QuestionPart[] | null;
}

export function MixedInput({
  value = {},
  onChange,
  disabled,
  content,
  subParts,
}: MixedInputProps) {
  return (
    <div className="space-y-4">
      {content?.map((block, idx) => (
        <ContentBlockRenderer key={idx} block={block} />
      ))}
      {subParts?.map((part) => (
        <div key={part.id} className="pl-4 border-l-2 border-muted">
          <p className="text-sm font-medium mb-2">
            {part.id}. {part.text}
          </p>
          <PartRenderer
            part={part}
            value={
              Array.isArray(value[part.id])
                ? value[part.id]
                : (value[part.id] as string) || ""
            }
            onChange={(v) => onChange(part.id, v)}
            disabled={disabled}
          />
        </div>
      ))}
    </div>
  );
}
