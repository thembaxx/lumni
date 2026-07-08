"use client";

import Calendar01Icon from "@hugeicons/core-free-icons/Calendar01Icon";
import SparklesIcon from "@hugeicons/core-free-icons/SparklesIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  generateDeterministicSchedule,
  type SchedulerInput,
  type StudySession,
  SUBJECT_OPTIONS,
} from "./schedule-generator";
import { ScheduleView } from "./schedule-view";

export function SmartScheduler() {
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [hoursPerDay, setHoursPerDay] = useState(2);
  const [examDate, setExamDate] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [schedule, setSchedule] = useState<StudySession[]>([]);
  const [difficultyMap, setDifficultyMap] = useState<Record<string, "easy" | "medium" | "hard">>(
    {},
  );

  const toggleSubject = (subjectId: string) => {
    if (selectedSubjects.includes(subjectId)) {
      setSelectedSubjects(selectedSubjects.filter((s) => s !== subjectId));
      const newMap = { ...difficultyMap };
      delete newMap[subjectId];
      setDifficultyMap(newMap);
    } else {
      setSelectedSubjects((prev) => [...prev, subjectId]);
      setDifficultyMap((prev) => ({ ...prev, [subjectId]: "medium" }));
    }
  };

  const updateDifficulty = (subjectId: string, difficulty: "easy" | "medium" | "hard") => {
    setDifficultyMap((prev) => ({ ...prev, [subjectId]: difficulty }));
  };

  const generateSchedule = async () => {
    if (selectedSubjects.length === 0 || !examDate) return;

    setIsGenerating(true);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    const input: SchedulerInput = {
      subjects: selectedSubjects.map((id) => ({
        id,
        name: SUBJECT_OPTIONS.find((s) => s.id === id)?.name || id,
        difficulty: difficultyMap[id] || "medium",
      })),
      hoursPerDay,
      examDate: new Date(examDate),
      startDate: new Date(),
    };

    const generatedSchedule = generateDeterministicSchedule(input);
    setSchedule(generatedSchedule);
    setIsGenerating(false);
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="px-5 pt-5 pb-3">
        <h2 className="ios-title-3 flex items-center gap-2 text-(--system-text-primary)">
          <HugeiconsIcon icon={Calendar01Icon} className="size-5 text-(--system-accent)" />
          Smart Scheduler
        </h2>
        <p className="ios-subhead mt-1 text-(--system-text-secondary)">
          Generate a personalised study plan for your exams.
        </p>
      </div>

      {schedule.length === 0 ? (
        <div className="px-5 pb-10">
          <div className="flex flex-col gap-4 rounded-2xl bg-system-background-secondary p-5">
            <Field>
              <FieldLabel>Select Subjects</FieldLabel>
              <div className="grid grid-cols-2 gap-2">
                {SUBJECT_OPTIONS.map((subject) => (
                  <div key={subject.id} className="flex flex-col gap-1.5">
                    <Button
                      variant={selectedSubjects.includes(subject.id) ? "default" : "ghost"}
                      onClick={() => toggleSubject(subject.id)}
                      className="w-full"
                    >
                      {subject.name}
                    </Button>
                    {selectedSubjects.includes(subject.id) && (
                      <div className="flex gap-1">
                        {(["easy", "medium", "hard"] as const).map((diff) => (
                          <Button
                            key={diff}
                            size="xs"
                            variant={difficultyMap[subject.id] === diff ? "default" : "ghost"}
                            onClick={() => updateDifficulty(subject.id, diff)}
                          >
                            {diff[0].toUpperCase()}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Field>

            <Field>
              <FieldLabel>Study Hours Per Day</FieldLabel>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((h) => (
                  <Button
                    key={h}
                    variant={hoursPerDay === h ? "default" : "ghost"}
                    onClick={() => setHoursPerDay(h)}
                  >
                    {h}h
                  </Button>
                ))}
              </div>
            </Field>

            <Field>
              <FieldLabel>First Exam Date</FieldLabel>
              <Input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="mt-2 rounded-xl"
              />
            </Field>

            <Button
              className="w-full rounded-xl"
              onClick={generateSchedule}
              disabled={selectedSubjects.length === 0 || !examDate || isGenerating}
            >
              {isGenerating ? (
                <>
                  <div className="mr-2 size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Generating…
                </>
              ) : (
                <>
                  <HugeiconsIcon icon={SparklesIcon} data-icon className="mr-2" />
                  Generate Schedule
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        <ScheduleView schedule={schedule} onReset={() => setSchedule([])} />
      )}
    </div>
  );
}
