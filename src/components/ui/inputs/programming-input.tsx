"use client";

import { type ReactNode } from "react";
import { useLazySyntaxHighlighter } from "@/lib/shared/lazy-syntax-highlighter";

function LazySyntaxHighlighter({ language, children }: { language: string; children: ReactNode }) {
  const { SyntaxHighlighter, style, loaded } = useLazySyntaxHighlighter("light");

  if (!loaded || !SyntaxHighlighter || !style) {
    return (
      <pre className="m-0 max-h-50 overflow-auto bg-muted p-3 text-xs">
        <code>{children}</code>
      </pre>
    );
  }

  return (
    <SyntaxHighlighter
      language={language}
      style={style}
      customStyle={{ margin: 0, fontSize: "0.8rem", maxHeight: 200 }}
    >
      {children}
    </SyntaxHighlighter>
  );
}

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface ProgrammingInputProps {
  value?: string | undefined;
  onChange?: (value: string) => void;
  language?: string;
  starterCode?: string;
  disabled?: boolean;
  onSubmit?: (value: string) => void;
}

export function ProgrammingInput({
  value = "",
  onChange = () => {},
  language = "delphi",
  starterCode,
  disabled,
  onSubmit,
}: ProgrammingInputProps) {
  return (
    <div className="flex flex-col gap-3">
      {starterCode && (
        <div className="overflow-hidden rounded border">
          <div className="bg-muted px-3 py-1 font-medium text-muted-foreground text-xs">
            Starter Code ({language})
          </div>
          <LazySyntaxHighlighter language={language}>{starterCode}</LazySyntaxHighlighter>
        </div>
      )}
      <Label htmlFor="programming-input">Your solution ({language})</Label>
      <Textarea
        id="programming-input"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        disabled={disabled}
        placeholder={`Write your ${language} code here...`}
        className={cn("min-h-38 font-mono text-base", starterCode && "mt-2")}
      />
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
  );
}
