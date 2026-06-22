"use client";

import { ContentBlockRenderer } from "@/components/exam/content-block-renderer";
import { PartRenderer } from "@/components/exam/part-renderer";
import type { ContentBlock, QuestionPart } from "@/types/exam-paper";

const EMPTY_VALUE: Record<string, string | string[]> = {};

interface MixedInputProps {
  value: Record<string, string | string[]> | undefined;
  onChange: (partId: string, value: string | string[]) => void;
  content?: ContentBlock[] | null;
  subParts?: QuestionPart[] | null;
  disabled?: boolean;
}

export function MixedInput({
  value = EMPTY_VALUE,
  onChange,
  content,
  subParts,
  disabled,
}: MixedInputProps) {
  return (
    <div className="flex flex-col gap-4">
      {content?.map((block) => (
        <ContentBlockRenderer
          key={`cb-${block.type}-${block.value ?? block.imagePath ?? ""}`}
          block={block}
        />
      ))}
      {subParts?.map((part) => (
        <div key={part.id} className="border-muted border-l-2 pl-4">
          <p className="mb-2 font-medium text-sm">
            {part.id}. {part.text}
          </p>
          <PartRenderer
            part={part}
            value={
              Array.isArray(value[part.id]) ? value[part.id] : (value[part.id] as string) || ""
            }
            onChange={(v) => onChange(part.id, v)}
            disabled={disabled}
          />
        </div>
      ))}
    </div>
  );
}
