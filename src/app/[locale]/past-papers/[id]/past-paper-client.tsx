"use client";

import File02Icon from "@hugeicons/core-free-icons/File02Icon";
import ArrowLeft01Icon from "@hugeicons/core-free-icons/ArrowLeft01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { getExamMarkdown } from "@/lib/server/exam-markdown";
import { SmartViewMarkdown } from "@/components/dashboard/practice/smart-view-markdown";

async function fetchExamPaper(id: string) {
  const res = await fetch(`/api/exams?id=${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error("Failed to fetch exam paper");
  return res.json();
}

export function PastPaperClient() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const { data: exam, isLoading: examLoading } = useQuery({
    queryKey: ["past-paper", id],
    queryFn: () => fetchExamPaper(id),
    enabled: !!id,
  });

  const { data: result, isLoading: contentLoading } = useQuery({
    queryKey: ["exam-markdown", exam?.fileUrl],
    queryFn: () => getExamMarkdown(exam?.fileUrl ?? ""),
    enabled: !!exam?.fileUrl,
    staleTime: 1000 * 60 * 5,
  });

  const headerChildren = useMemo(
    () =>
      result && result.source !== "error" ? (
        <Badge variant="outline" className="shrink-0 px-1.5 text-(--fs-caption-3) capitalize">
          {result.source}
        </Badge>
      ) : undefined,
    [result],
  );

  if (examLoading) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <LoadingSpinner size="lg" />
          <span className="text-muted-foreground text-xs">Loading smart view…</span>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <EmptyState icon={File02Icon} title="Past paper not found" />
      </div>
    );
  }

  return (
    <div className="flex h-dvh w-full flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b bg-background px-4 py-3">
        <Button variant="ghost" size="icon-sm" onClick={() => router.back()} aria-label="Go back">
          <HugeiconsIcon icon={ArrowLeft01Icon} />
        </Button>
        <h1 className="balance flex-1 truncate text-wrap font-semibold text-sm">
          {exam.title ?? exam.subject}
        </h1>
        {exam.year && (
          <Badge variant="secondary" className="shrink-0 px-1.5 text-(--fs-caption-3)">
            {exam.year}
          </Badge>
        )}
        {headerChildren}
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        {contentLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <LoadingSpinner size="lg" />
              <span className="text-muted-foreground text-xs">Loading smart view…</span>
            </div>
          </div>
        ) : result?.source === "error" ? (
          <EmptyState
            icon={File02Icon}
            title="Failed to load content"
            description={result.error || "Unable to convert PDF to markdown"}
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(exam.fileUrl, "_blank")}
              >
                View Original PDF
              </Button>
            }
          />
        ) : result?.content ? (
          <div className="p-4 sm:p-6">
            <div className="prose prose-sm sm:prose dark:prose-invert max-w-none">
              <SmartViewMarkdown content={result.content} />
            </div>
          </div>
        ) : (
          <EmptyState icon={File02Icon} title="No content available" />
        )}
      </div>
    </div>
  );
}
