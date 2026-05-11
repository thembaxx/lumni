"use client";

import type { QuestionPart } from "@/types/exam-paper";
import { MultipleChoiceInput } from "./inputs/multiple-choice-input";
import { MatchingInput } from "./inputs/matching-input";
import { ShortAnswerInput } from "./inputs/short-answer-input";
import { LongAnswerInput } from "./inputs/long-answer-input";
import { EssayInput } from "./inputs/essay-input";
import { CalculationInput } from "./inputs/calculation-input";
import { DiagramInput } from "./inputs/diagram-input";
import { SourceBasedInput } from "./inputs/source-based-input";
import { ProgrammingInput } from "./inputs/programming-input";
import { DataResponseInput } from "./inputs/data-response-input";
import { MixedInput } from "./inputs/mixed-input";
import { ContentBlockRenderer } from "./content-block-renderer";

interface PartRendererProps {
  part: QuestionPart;
  value: string | string[] | Record<string, string | string[]> | undefined;
  onChange: (value: string | string[]) => void;
  disabled?: boolean;
}

export function PartRenderer({
  part,
  value,
  onChange,
  disabled,
}: PartRendererProps) {
  const partValue = value as string | undefined;

  switch (part.type) {
    case "multiple-choice":
      return (
        <MultipleChoiceInput
          options={part.options || []}
          value={partValue}
          onChange={onChange}
          disabled={disabled}
        />
      );

    case "matching":
      return (
        <MatchingInput
          table={part.table!}
          value={(value as Record<string, string>) || {}}
          onChange={(pairs) => onChange(JSON.stringify(pairs))}
          disabled={disabled}
        />
      );

    case "short-answer":
      return (
        <ShortAnswerInput
          value={partValue}
          onChange={onChange}
          disabled={disabled}
        />
      );

    case "long-answer":
      return (
        <LongAnswerInput
          value={partValue}
          onChange={onChange}
          disabled={disabled}
        />
      );

    case "essay":
      return (
        <EssayInput
          value={partValue}
          onChange={onChange}
          disabled={disabled}
        />
      );

    case "calculation":
      return (
        <CalculationInput
          answerValue={partValue || ""}
          workingValue=""
          onAnswerChange={onChange}
          onWorkingChange={() => {}}
          disabled={disabled}
        />
      );

    case "diagram":
      return (
        <DiagramInput
          value={partValue}
          onChange={onChange}
          disabled={disabled}
        />
      );

    case "source-based":
      return (
        <SourceBasedInput
          value={partValue}
          onChange={onChange}
          disabled={disabled}
          sourceRefs={part.sourceRefs || []}
          content={part.content}
        />
      );

    case "programming":
      return (
        <ProgrammingInput
          value={partValue}
          onChange={onChange}
          disabled={disabled}
          language={part.content?.find((c) => c.type === "code")?.language}
          starterCode={part.content?.find((c) => c.type === "code")?.value}
        />
      );

    case "data-response":
      return (
        <DataResponseInput
          value={partValue}
          onChange={onChange}
          disabled={disabled}
          content={part.content}
        />
      );

    case "mixed":
      return (
        <MixedInput
          value={
            typeof value === "object" && !Array.isArray(value)
              ? (value as Record<string, string | string[]>)
              : {}
          }
          onChange={(subId, v) => {
            const current = { ...((typeof value === "object" && !Array.isArray(value) ? value : {}) as Record<string, string | string[]>) };
            current[subId] = v;
            onChange(JSON.stringify(current));
          }}
          disabled={disabled}
          content={part.content}
          subParts={part.subParts}
        />
      );

    default:
      return <ShortAnswerInput value={partValue} onChange={onChange} disabled={disabled} />;
  }
}
