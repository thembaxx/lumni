"use client";

import Search01Icon from "@hugeicons/core-free-icons/Search01Icon";
import UserIcon from "@hugeicons/core-free-icons/UserIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import * as m from "motion/react-m";
import { useState } from "react";
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { MatricResult } from "@/lib/matric-results";
import { apiFetch } from "@/lib/shared/api-fetch";

const LEVELS: Record<number, string> = {
  7: "Outstanding (80-100)",
  6: "Meritorious (70-79)",
  5: "Substantial (60-69)",
  4: "Adequate (50-59)",
  3: "Moderate (40-49)",
  2: "Elementary (30-39)",
  1: "Not Achieved (0-29)",
};

export function ResultsSearch() {
  const [candidateNumber, setCandidateNumber] = useState("");
  const [studentInfo, setStudentInfo] = useState<{
    firstName: string;
    lastName: string;
  } | null>(null);
  const [results, setResults] = useState<MatricResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (!candidateNumber.trim()) return;
    setIsSearching(true);
    setError("");
    setStudentInfo(null);
    try {
      const data = await apiFetch<{
        results: MatricResult[];
        total: number;
      }>(`/api/matric-results?candidateNumber=${encodeURIComponent(candidateNumber.trim())}`, {
        method: "GET",
      });
      setResults(data.results);
      if (data.results.length > 0) {
        setStudentInfo({
          firstName: data.results[0].firstName,
          lastName: data.results[0].lastName,
        });
      }
    } catch {
      setError("Failed to search results. Please try again.");
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="px-5 pt-5 pb-3">
        <h2 className="ios-title-3 flex items-center gap-2 text-(--system-text-primary)">
          <HugeiconsIcon icon={Search01Icon} className="size-5 text-(--system-accent)" />
          Results Search
        </h2>
        <p className="ios-subhead mt-1 text-(--system-text-secondary)">
          Search matric results by candidate number.
        </p>
      </div>

      <div className="px-5 pb-5">
        <div className="flex flex-col gap-4 rounded-2xl bg-system-background-secondary p-5">
          <div>
            <Label className="mb-2 text-sm">Candidate Number</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <HugeiconsIcon
                  icon={Search01Icon}
                  className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  aria-label="Search by candidate number"
                  placeholder="e.g. 2024123456"
                  value={candidateNumber}
                  onChange={(e) => setCandidateNumber(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="rounded-xl pl-10"
                />
              </div>
              <Button onClick={handleSearch} className="rounded-xl">
                Search
              </Button>
            </div>
          </div>
        </div>
      </div>

      {error ? (
        <div className="px-5 pb-10">
          <Empty className="border-none">
            <EmptyMedia>
              <HugeiconsIcon icon={Search01Icon} className="size-12 text-destructive" />
            </EmptyMedia>
            <EmptyTitle>Search failed</EmptyTitle>
            <EmptyDescription>{error}</EmptyDescription>
          </Empty>
        </div>
      ) : isSearching ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="size-8 animate-spin rounded-full border-2 border-(--system-accent) border-t-transparent" />
        </div>
      ) : results.length > 0 && studentInfo ? (
        <div className="flex flex-1 flex-col gap-4 px-5 pb-10">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-(--system-accent)/10">
              <HugeiconsIcon icon={UserIcon} className="size-5 text-foreground" />
            </div>
            <div>
              <h3 className="font-semibold">
                {studentInfo.firstName} {studentInfo.lastName}
              </h3>
              <p className="text-muted-foreground text-xs">Candidate: {candidateNumber}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {results.map((result, idx) => (
              <m.div
                key={`${result.subject}${result.examYear}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="rounded-xl border-border p-4 shadow-level-1">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <p className="font-medium">{result.subject}</p>
                      <p className="text-muted-foreground text-xs">
                        {result.examYear} {result.examSession}
                        {result.paperNumber ? ` | Paper ${result.paperNumber}` : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-lg tabular-nums">
                        {result.mark}/{result.outOf}
                      </span>
                      <p className="text-muted-foreground text-xs">
                        Level {result.level} — {LEVELS[result.level] || result.achievement}
                      </p>
                    </div>
                  </div>
                </Card>
              </m.div>
            ))}
          </div>
        </div>
      ) : candidateNumber ? (
        <div className="px-5 pb-10">
          <Empty className="border-none">
            <EmptyMedia>
              <HugeiconsIcon icon={Search01Icon} className="size-12 text-muted-foreground" />
            </EmptyMedia>
            <EmptyTitle>No results found</EmptyTitle>
            <EmptyDescription>Check the candidate number and try again</EmptyDescription>
          </Empty>
        </div>
      ) : (
        <div className="px-5 pb-10">
          <Empty className="border-none">
            <EmptyMedia>
              <HugeiconsIcon icon={Search01Icon} className="size-12 text-muted-foreground" />
            </EmptyMedia>
            <EmptyTitle>Enter a candidate number</EmptyTitle>
            <EmptyDescription>Search for matric results by NSC candidate number</EmptyDescription>
          </Empty>
        </div>
      )}
    </div>
  );
}
