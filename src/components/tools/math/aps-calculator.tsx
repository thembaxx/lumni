"use client";

import Add01Icon from "@hugeicons/core-free-icons/Add01Icon";
import CalculatorIcon from "@hugeicons/core-free-icons/CalculatorIcon";
import CheckmarkCircle01Icon from "@hugeicons/core-free-icons/CheckmarkCircle01Icon";
import Delete01Icon from "@hugeicons/core-free-icons/Delete01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { FadeIn } from "@/components/shared/fade-in";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApsScoreCard } from "./aps-score-card";
import { SubjectBreakdown } from "./subject-breakdown";
import { UniversityRequirements } from "./university-requirements";
import { getAPSForSubject } from "@/lib/shared/aps";

interface Subject {
  id: string;
  name: string;
  percentage: number;
}

export function APSCalculator() {
  const [subjects, setSubjects] = useState<Subject[]>([{ id: "1", name: "", percentage: 0 }]);
  const [includeLifeOrientation, setIncludeLifeOrientation] = useState(false);

  const addSubject = () => {
    setSubjects((prev) => [...prev, { id: Date.now().toString(), name: "", percentage: 0 }]);
  };

  const removeSubject = (id: string) => {
    setSubjects((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((s) => s.id !== id);
    });
  };

  const updateSubject = (id: string, field: "name" | "percentage", value: string | number) => {
    setSubjects((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const calculateAPS = (): number => {
    const validSubjects = subjects.filter((s) => s.name && s.percentage > 0);
    return validSubjects
      .map((s) => ({
        score: getAPSForSubject(s.percentage),
        isLO: s.name.toLowerCase().includes("life orientation"),
      }))
      .reduce((acc, { score, isLO }) => {
        if (!isLO || includeLifeOrientation) {
          acc.push(score);
        }
        return acc;
      }, [] as number[])
      .toSorted((a, b) => b - a)
      .slice(0, 6)
      .reduce((sum, s) => sum + s, 0);
  };

  const totalAPS = calculateAPS();
  const hasData = subjects.some((s) => s.percentage > 0);

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="px-5 pt-5 pb-3">
        <h2 className="ios-title-3 flex items-center gap-2 text-(--system-text-primary)">
          <HugeiconsIcon icon={CalculatorIcon} className="size-5 text-(--system-accent)" />
          APS Calculator
        </h2>
        <p className="ios-subhead mt-1 text-(--system-text-secondary)">
          Calculate your Admission Point Score for university applications.
        </p>
      </div>

      <div className="px-5 pb-5">
        <div className="flex flex-col gap-3 rounded-2xl bg-system-background-secondary p-5">
          {subjects.map((subject, index) => (
            <FadeIn
              key={subject.id}
              direction="up"
              distance={10}
              delay={index * 0.05}
              className="flex items-center gap-2"
            >
              <Input
                placeholder="Subject name"
                value={subject.name}
                onChange={(e) => updateSubject(subject.id, "name", e.target.value)}
                className="flex-1 rounded-xl"
              />
              <div className="relative">
                <Input
                  type="number"
                  placeholder="%"
                  min={0}
                  max={100}
                  value={subject.percentage || ""}
                  onChange={(e) =>
                    updateSubject(subject.id, "percentage", parseInt(e.target.value, 10) || 0)
                  }
                  className="w-20 rounded-xl pr-7 tabular-nums"
                />
                <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground text-xs">
                  %
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => removeSubject(subject.id)}
                disabled={subjects.length === 1}
                className="size-9"
                aria-label="Remove subject"
              >
                <HugeiconsIcon icon={Delete01Icon} data-icon />
              </Button>
            </FadeIn>
          ))}

          <div className="flex gap-2 pt-1">
            <Button variant="outline" onClick={addSubject} className="flex-1 rounded-xl">
              <HugeiconsIcon icon={Add01Icon} data-icon className="mr-2" />
              Add Subject
            </Button>
            <Button
              variant={includeLifeOrientation ? "default" : "outline"}
              onClick={() => setIncludeLifeOrientation(!includeLifeOrientation)}
              className="rounded-xl"
            >
              {includeLifeOrientation && (
                <HugeiconsIcon icon={CheckmarkCircle01Icon} data-icon className="mr-1.5" />
              )}
              Include LO
            </Button>
          </div>
        </div>
      </div>

      <ApsScoreCard totalAPS={totalAPS} />

      {hasData && <SubjectBreakdown subjects={subjects} />}

      <UniversityRequirements totalAPS={totalAPS} />
    </div>
  );
}
