"use client";

import BookOpen01Icon from "@hugeicons/core-free-icons/BookOpen01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card size="sm">
      <CardHeader>
        <CardTitle>
          {paper.subject} — {paper.paperCode}
        </CardTitle>
        <CardDescription>
          {paper.year} &middot; {paper.examPeriod} &middot; Paper {paper.paperNumber}
          {paper.totalMarks ? ` &middot; ${paper.totalMarks} marks` : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="default"
            onClick={() => router.push(`/exam/${paper.id}`)}
            className="gap-1.5 rounded-full text-xs"
          >
            <HugeiconsIcon icon={BookOpen01Icon} className="size-3.5" />
            View Paper
          </Button>
        </div>
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
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="min-h-dvh bg-system-grouped pt-4 pb-24">
      <PageContainer className="flex flex-col gap-8">
        <div>
          <h1 className="ios-title-1 font-semibold text-foreground tracking-tight">Past Papers</h1>
          <p className="ios-subhead mt-1.5 text-muted-foreground/60">
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
              className="mx-auto mb-4 size-12 text-muted-foreground/20"
            />
            <p className="text-muted-foreground/40 text-sm">
              Select a subject to browse past exam papers
            </p>
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 rounded-card-lg" />
            ))}
          </div>
        )}

        {isError && (
          <div className="py-20 text-center">
            <p className="text-destructive text-sm">Failed to load papers: {error?.message}</p>
          </div>
        )}

        {!isLoading && !isError && selectedSubject && papers.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-muted-foreground/40 text-sm">
              No exam papers found for this subject
            </p>
          </div>
        )}

        {!isLoading && papers.length > 0 && (
          <div className="flex flex-col gap-3">
            {papers.map((paper) => (
              <PaperCard key={paper.id} paper={paper} />
            ))}
          </div>
        )}
      </PageContainer>
    </div>
  );
}
