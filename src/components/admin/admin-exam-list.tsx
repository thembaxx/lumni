"use client";

import { useState } from "react";
import {
  ExternalLink,
  Trash2,
  Loader2,
  FileText,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface ExamListItem {
  id: string;
  subject: string;
  paperCode: string;
  examPeriod: string;
  year: number;
  grade: number;
  language: string;
  totalMarks: number;
  duration: string;
  fileKeys: { pdf: string; markdown: string; json: string } | null;
  uploadedAt: string;
}

export function AdminExamList() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-exams"],
    queryFn: async () => {
      const res = await fetch("/api/admin/exams");
      if (!res.ok) throw new Error("Failed to fetch exams");
      return res.json() as Promise<{
        exams: ExamListItem[];
        total: number;
      }>;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/exams/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-exams"] });
    },
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this exam paper and all its files?")) return;
    setDeleting(id);
    try {
      await deleteMutation.mutateAsync(id);
    } finally {
      setDeleting(null);
    }
  };

  const exams = data?.exams || [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-foreground">
          Exam Papers ({data?.total || 0})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="p-4 text-sm text-destructive">
            Failed to load exam papers
          </div>
        ) : exams.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FileText className="w-8 h-8 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">
              No exam papers uploaded yet
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Upload a PDF above to get started
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-[500px]">
            <div className="divide-y">
              {exams.map((exam) => (
                <div
                  key={exam.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {exam.subject} {exam.paperCode}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {exam.examPeriod} &middot; {exam.year} &middot;{" "}
                      {exam.language} &middot; {exam.totalMarks} marks
                      &middot; {exam.duration}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => router.push(`/exam/${exam.id}`)}
                      title="Take exam"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(exam.id)}
                      disabled={deleting === exam.id}
                      title="Delete exam"
                    >
                      {deleting === exam.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
