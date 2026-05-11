"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DataTable } from "@/types/exam-paper";

interface MatchingInputProps {
  table: DataTable;
  value: Record<string, string> | undefined;
  onChange: (pairs: Record<string, string>) => void;
  disabled?: boolean;
}

export function MatchingInput({
  table,
  value = {},
  onChange,
  disabled,
}: MatchingInputProps) {
  const colA = table.headers[0] || "Column A";
  const colB = table.headers[1] || "Column B";
  const items: Array<{ left: string; right: string }> = [];
  for (const row of table.rows) {
    const leftVal = row[0];
    const rightVal = row[1];
    if (leftVal != null && rightVal != null) {
      items.push({ left: String(leftVal), right: String(rightVal) });
    }
  }

  const rightOptions = [...new Set(items.map((i) => i.right))];

  const handleChange = (left: string, right: string) => {
    onChange({ ...value, [left]: right });
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center text-sm font-medium text-muted-foreground mb-1">
        <span>{colA}</span>
        <span />
        <span>{colB}</span>
      </div>
      {items.map((item, idx) => {
        const itemLeft = item.left;
        return (
          <div
            key={idx}
            className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center"
          >
            <span className="text-sm">{itemLeft}</span>
            <span className="text-muted-foreground">↔</span>
            <Select
              value={(value && value[itemLeft]) || ""}
              onValueChange={(v) => {
                if (v) onChange({ ...value, [itemLeft]: v });
              }}
              disabled={disabled}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {rightOptions.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      })}
    </div>
  );
}
