"use client";

import { Button } from "@/components/ui/button";

const MATH_SYMBOLS = [
  { label: "√", value: "√" },
  { label: "π", value: "π" },
  { label: "²", value: "²" },
  { label: "³", value: "³" },
  { label: "±", value: "±" },
  { label: "÷", value: "÷" },
  { label: "×", value: "×" },
  { label: "∑", value: "∑" },
  { label: "∫", value: "∫" },
  { label: "≠", value: "≠" },
  { label: "≈", value: "≈" },
  { label: "∞", value: "∞" },
];

interface SymbolPaletteProps {
  onInsert: (symbol: string) => void;
}

export function SymbolPalette({ onInsert }: SymbolPaletteProps) {
  return (
    <div className="flex flex-wrap gap-1">
      {MATH_SYMBOLS.map((s) => (
        <Button
          key={s.label}
          variant="ghost"
          size="sm"
          onClick={() => onInsert(s.value)}
          className="ios-footnote h-6 w-7 p-0 text-(--system-text-secondary) hover:text-(--system-accent)"
        >
          {s.label}
        </Button>
      ))}
    </div>
  );
}
