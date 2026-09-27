"use client";

import BookOpen01Icon from "@hugeicons/core-free-icons/BookOpen01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FlagBar } from "@/components/ui/flag-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { SubjectSelect } from "@/components/ui/subject-select";
import { useRouter } from "@/i18n/navigation";

interface ExamPaper {
  id: string;
  subject: string;
  subjectCode: string;
  paperCode: string;
  paperNumber: number;
  examPeriod: string;
  year: number;
  grade: number;
  language: string;
  totalMarks: number;
  duration: string;
  type: string;
}

async function fetchPapers(subject: string): Promise<ExamPaper[]> {
  if (!subject) return [];
  const res = await fetch(`/api/exams?subject=${encodeURIComponent(subject)}`);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.exams ?? []) as ExamPaper[];
}

function PaperCard({ paper }: { paper: ExamPaper }) {
  const router = useRouter();
  return (
    <Card variant="flat">
      <CardHeader>
        <CardTitle className="text-base font-bold text-(--fg)">
          {paper.subject} — {paper.paperCode}
        </CardTitle>
        <CardDescription className="text-xs text-(--fg-muted)">
          {paper.year} &middot; {paper.examPeriod} &middot; Paper {paper.paperNumber}
          {paper.totalMarks ? ` &middot; ${paper.totalMarks} marks` : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="mt-2">
        <Button
          size="sm"
          variant="primary"
          onClick={() => router.push(`/exam/${paper.id}`)}
          className="gap-1.5"
        >
          <HugeiconsIcon icon={BookOpen01Icon} className="size-4" />
          View Paper
        </Button>
      </CardContent>
    </Card>
  );
}

export function PastPapersClient() {
  const [selectedSubject, setSelectedSubject] = useState("");

  const {
    data: papers = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["past-papers", selectedSubject],
    queryFn: () => fetchPapers(selectedSubject),
    enabled: !!selectedSubject,
    staleTime: 1000 * 60 * 5,
  });

  return (
    <div className="min-h-dvh bg-(--bg) text-(--fg)">
      <FlagBar height={8} />
      <PageContainer className="flex flex-col gap-8 py-8">
        <div>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-(--fg)">
            Past Papers
          </h1>
          <p className="font-body text-sm text-(--fg-muted) mt-1">
            Browse and practice with past exam papers
          </p>
        </div>

        <div className="max-w-sm">
          <SubjectSelect
            value={selectedSubject}
            onChange={setSelectedSubject}
            placeholder="Select a subject"
          />
        </div>

        {!selectedSubject && (
          <div className="py-20 text-center">
            <HugeiconsIcon
              icon={BookOpen01Icon}
              className="mx-auto mb-4 size-12 text-(--fg-muted)/40"
            />
            <p className="font-body text-sm text-(--fg-muted)">
              Select a subject to browse past exam papers
            </p>
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 rounded-lg" />
            ))}
          </div>
        )}

        {isError && (
          <div className="py-20 text-center">
            <p className="font-body text-sm font-bold text-(--accent-red)">
              Failed to load papers: {error?.message}
            </p>
          </div>
        )}

        {!isLoading && !isError && selectedSubject && papers.length === 0 && (
          <div className="py-20 text-center">
            <p className="font-body text-sm text-(--fg-muted)">
              No exam papers found for this subject
            </p>
          </div>
        )}

        {!isLoading && papers.length > 0 && (
          <div className="flex flex-col gap-4">
            {papers.map((paper) => (
              <PaperCard key={paper.id} paper={paper} />
            ))}
          </div>
        )}
      </PageContainer>
    </div>
  );
}
