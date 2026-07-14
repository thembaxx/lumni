"use client";

import CheckListIcon from "@hugeicons/core-free-icons/CheckListIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

interface GeneratePlanFormProps {
  isGenerating: boolean;
  onGenerate: (options: {
    targetAps: number;
    dailyStudyMinutes: number;
    includeWeekends: boolean;
    horizonDays: number;
  }) => Promise<void>;
  onCancel: () => void;
}

export function GeneratePlanForm({ isGenerating, onGenerate, onCancel }: GeneratePlanFormProps) {
  const [targetAps, setTargetAps] = useState("25");
  const [dailyMinutes, setDailyMinutes] = useState("30");
  const [includeWeekends, setIncludeWeekends] = useState(false);
  const [horizonDays, setHorizonDays] = useState("30");
  const [horizonCustom, setHorizonCustom] = useState("");

  const handleGenerate = useCallback(async () => {
    const resolvedHorizon =
      horizonDays === "custom"
        ? Number.parseInt(horizonCustom, 10) || 30
        : Number.parseInt(horizonDays, 10);
    await onGenerate({
      targetAps: Number.parseInt(targetAps, 10) || 25,
      dailyStudyMinutes: Number.parseInt(dailyMinutes, 10) || 30,
      includeWeekends,
      horizonDays: resolvedHorizon,
    });
  }, [targetAps, dailyMinutes, includeWeekends, horizonDays, horizonCustom, onGenerate]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 font-bold text-base tracking-tight">
          <HugeiconsIcon icon={CheckListIcon} className="size-5" />
          Generate Study Plan
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-muted-foreground text-sm">
          Your plan will focus on your weakest topics based on quiz performance, scheduled
          {includeWeekends ? " across all days" : " across weekdays"}
          {horizonDays === "custom"
            ? ` for ${horizonCustom || "…"} days`
            : ` for ${horizonDays} days`}
          .
        </p>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="target-aps">Target APS</FieldLabel>
            <Input
              id="target-aps"
              type="number"
              min="1"
              max="42"
              value={targetAps}
              onChange={(e) => setTargetAps(e.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="daily-minutes">Daily minutes</FieldLabel>
            <Input
              id="daily-minutes"
              type="number"
              min="5"
              max="480"
              value={dailyMinutes}
              onChange={(e) => setDailyMinutes(e.target.value)}
            />
          </Field>
        </FieldGroup>
        <label
          htmlFor="include-weekends"
          className="flex cursor-pointer items-center gap-2 text-xs"
        >
          <Checkbox
            id="include-weekends"
            checked={includeWeekends}
            onCheckedChange={(checked) => setIncludeWeekends(checked === true)}
          />
          Include weekends
        </label>
        <div className="flex flex-col gap-1.5">
          <span className="text-muted-foreground text-xs">Plan horizon</span>
          <div className="flex flex-wrap gap-1.5">
            {["7", "14", "30"].map((days) => (
              <Button
                key={days}
                size="sm"
                variant={horizonDays === days ? "default" : "outline"}
                onClick={() => {
                  setHorizonDays(days);
                  setHorizonCustom("");
                }}
              >
                {days} days
              </Button>
            ))}
            <Button
              size="sm"
              variant={horizonDays === "custom" ? "default" : "outline"}
              onClick={() => setHorizonDays("custom")}
            >
              Custom
            </Button>
          </div>
          {horizonDays === "custom" && (
            <Input
              type="number"
              min="7"
              max="90"
              aria-label="Custom horizon days"
              placeholder="Days"
              value={horizonCustom}
              className="mt-1 h-8 w-24"
              onChange={(e) => setHorizonCustom(e.target.value)}
            />
          )}
        </div>
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={isGenerating}>
            Cancel
          </Button>
          <Button size="sm" disabled={isGenerating} onClick={handleGenerate}>
            {isGenerating ? "Generating…" : "Generate Plan"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
