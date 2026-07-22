"use client";

import Calendar01Icon from "@hugeicons/core-free-icons/Calendar01Icon";
import CheckListIcon from "@hugeicons/core-free-icons/CheckListIcon";
import MagicWand01Icon from "@hugeicons/core-free-icons/MagicWand01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StudyPlanEmptyProps {
  onGenerate: () => void;
}

export function StudyPlanEmpty({ onGenerate }: StudyPlanEmptyProps) {
  return (
    <Card className="rounded-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 font-bold text-base tracking-tight">
          <HugeiconsIcon icon={CheckListIcon} className="size-5" />
          Study Plan
        </CardTitle>
        <Button size="sm" onClick={onGenerate}>
          <HugeiconsIcon icon={MagicWand01Icon} data-icon="inline-start" />
          Generate Plan
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3 rounded-card bg-muted/30 p-2.5">
          <HugeiconsIcon icon={Calendar01Icon} className="size-4 text-muted-foreground" />
          <p className="text-muted-foreground text-sm">
            No study plan yet. Generate a personalised plan based on your competency data.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
