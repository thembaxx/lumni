"use client";

import Search01Icon from "@hugeicons/core-free-icons/Search01Icon";
import UserIcon from "@hugeicons/core-free-icons/UserIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import * as m from "motion/react-m";
import { useState } from "react";
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/shared/empty-state";
import AlertCircleIcon from "@hugeicons/core-free-icons/AlertCircleIcon";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { MatricResult } from "@/lib/matric-results";
import { matricResultsYears } from "@/lib/matric-results";
import { apiFetch } from "@/lib/shared/api-fetch";

export function ResultsSearch() {
  const [selectedYear, setSelectedYear] = useState<number>(matricResultsYears[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<MatricResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    setIsSearching(true);
    setError("");
    try {
      const data = await apiFetch<{
        results: MatricResult[];
        year: number;
        total: number;
      }>(`/api/matric-results?name=${encodeURIComponent(searchQuery)}&year=${selectedYear}`, {
        method: "GET",
      });
      setResults(data.results);
    } catch {
      setError("Failed to search results. Please try again.");
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const getGrade = (percentage: number): string => {
    if (percentage >= 80) return "A";
    if (percentage >= 70) return "B";
    if (percentage >= 60) return "C";
    if (percentage >= 50) return "D";
    if (percentage >= 40) return "E";
    return "F";
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="px-5 pt-5 pb-3">
        <h2 className="ios-title-3 flex items-center gap-2 text-(--system-text-primary)">
          <HugeiconsIcon icon={Search01Icon} className="size-5 text-(--system-accent)" />
          Results Search
        </h2>
        <p className="ios-subhead mt-1 text-(--system-text-secondary)">
          Search past matric results by name and year.
        </p>
      </div>

      <div className="px-5 pb-3">
        <div className="flex items-start gap-2.5 rounded-xl border border-(--system-warning)/30 bg-(--system-warning)/10 p-3">
          <HugeiconsIcon
            icon={AlertCircleIcon}
            className="mt-0.5 size-4 shrink-0 text-(--system-warning)"
          />
          <p className="text-foreground/80 text-xs leading-relaxed">
            Demo data — not real matric results. Official DBE results pending integration.
          </p>
        </div>
      </div>

      <div className="px-5 pb-5">
        <div className="flex flex-col gap-4 rounded-2xl bg-system-background-secondary p-5">
          <div>
            <Label className="mb-2 text-sm">Year</Label>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {matricResultsYears.map((year) => (
                <Button
                  key={year}
                  variant={selectedYear === year ? "default" : "ghost"}
                  onClick={() => {
                    setSelectedYear(year);
                    setResults([]);
                    setSearchQuery("");
                  }}
                >
                  {year}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <HugeiconsIcon
                icon={Search01Icon}
                className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                placeholder="Search by name…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
      ) : results.length > 0 ? (
        <div className="flex flex-1 flex-col gap-4 px-5 pb-10">
          <p className="text-muted-foreground text-sm">{results.length} results found</p>
          {results.map((result, idx) => (
            <m.div
              key={result.examNumber}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="rounded-xl border-border p-4 shadow-sm">
                <div className="mb-3 flex items-start gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-(--system-accent)/10">
                    <HugeiconsIcon icon={UserIcon} className="size-5 text-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{result.name}</h3>
                    <p className="text-muted-foreground text-xs">
                      {result.school}, {result.province}
                    </p>
                    <p className="text-muted-foreground text-xs tabular-nums">
                      Exam No: {result.examNumber}
                    </p>
                  </div>
                </div>

                <div className="mb-3 grid grid-cols-2 gap-2">
                  {result.subjects.map((subj) => (
                    <div
                      key={subj.name}
                      className="flex justify-between rounded-lg bg-system-background-secondary p-2.5 text-sm"
                    >
                      <span className="text-muted-foreground">{subj.name}</span>
                      <span className="font-medium tabular-nums">
                        {subj.percentage}% ({getGrade(subj.percentage)})
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between border-border border-t pt-2">
                  <span className="text-muted-foreground text-sm">Overall</span>
                  <span className="font-extrabold text-lg tabular-nums">{result.overall}%</span>
                </div>
              </Card>
            </m.div>
          ))}
        </div>
      ) : searchQuery ? (
        <div className="px-5 pb-10">
          <Empty className="border-none">
            <EmptyMedia>
              <HugeiconsIcon icon={Search01Icon} className="size-12 text-muted-foreground" />
            </EmptyMedia>
            <EmptyTitle>No results found for "{searchQuery}"</EmptyTitle>
            <EmptyDescription>Try searching with a different name</EmptyDescription>
          </Empty>
        </div>
      ) : (
        <div className="px-5 pb-10">
          <Empty className="border-none">
            <EmptyMedia>
              <HugeiconsIcon icon={Search01Icon} className="size-12 text-muted-foreground" />
            </EmptyMedia>
            <EmptyTitle>Enter a name to search</EmptyTitle>
            <EmptyDescription>Search through {selectedYear} results</EmptyDescription>
          </Empty>
        </div>
      )}
    </div>
  );
}
