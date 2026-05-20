"use client";

import {
	ArrowUpRight01Icon,
	Delete02Icon,
	File02Icon,
	RadialIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

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
	const { push } = useRouter();
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
			<CardHeader>
				<CardTitle>Exam Papers ({data?.total || 0})</CardTitle>
			</CardHeader>
			<CardContent className="p-0">
				{isLoading ? (
					<div className="flex items-center justify-center py-8">
						<HugeiconsIcon
							icon={RadialIcon}
							className="size-5 animate-spin text-muted-foreground"
						/>
					</div>
				) : error ? (
					<div className="p-4 text-destructive text-sm">
						Failed to load exam papers
					</div>
				) : exams.length === 0 ? (
					<Empty>
						<EmptyHeader>
							<HugeiconsIcon
								icon={File02Icon}
								className="size-8 text-muted-foreground/30"
							/>
							<EmptyTitle>No exam papers uploaded yet</EmptyTitle>
						</EmptyHeader>
						<EmptyContent>
							<EmptyDescription>
								Upload a PDF above to get started
							</EmptyDescription>
						</EmptyContent>
					</Empty>
				) : (
					<ScrollArea className="max-h-[500px]">
						<div className="divide-y">
							{exams.map((exam) => (
								<div
									key={exam.id}
									className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/30"
								>
									<div className="min-w-0 flex-1">
										<p className="truncate font-medium text-sm">
											{exam.subject} {exam.paperCode}
										</p>
										<p className="text-muted-foreground text-xs">
											{exam.examPeriod} &middot; {exam.year} &middot;{" "}
											{exam.language} &middot; {exam.totalMarks} marks &middot;{" "}
											{exam.duration}
										</p>
									</div>
									<div className="flex shrink-0 items-center gap-1">
										<Button
											variant="ghost"
											size="icon"
											onClick={() => push(`/exam/${exam.id}`)}
											title="Take exam"
										>
											<HugeiconsIcon
												icon={ArrowUpRight01Icon}
												className="size-4"
											/>
										</Button>
										<Button
											variant="ghost"
											size="icon"
											className="text-destructive hover:text-destructive"
											onClick={() => handleDelete(exam.id)}
											disabled={deleting === exam.id}
											title="Delete exam"
										>
											{deleting === exam.id ? (
												<HugeiconsIcon
													icon={RadialIcon}
													className="size-4 animate-spin"
												/>
											) : (
												<HugeiconsIcon icon={Delete02Icon} className="size-4" />
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
