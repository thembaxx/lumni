"use client";

import { BookOpen02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
import type { StudentAssignment } from "@/app/api/student/assignments/route";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function MyAssignments() {
	const { data, isLoading } = useQuery<{ assignments: StudentAssignment[] }>({
		queryKey: ["studentAssignments"],
		queryFn: () =>
			fetch("/api/student/assignments").then((r) => {
				if (!r.ok) throw new Error("Failed to fetch");
				return r.json();
			}),
		staleTime: 1000 * 60 * 5,
	});

	const assignments = data?.assignments ?? [];

	if (isLoading) return null;
	if (assignments.length === 0) return null;

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2 font-extrabold text-base tracking-tight">
					<HugeiconsIcon icon={BookOpen02Icon} className="size-5" />
					My Assignments
				</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-col gap-2">
				{assignments.map((a) => (
					<div
						key={a.id}
						className="flex items-start gap-3 rounded-xl bg-muted/30 p-3"
					>
						<div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[--system-accent]/10">
							<HugeiconsIcon
								icon={BookOpen02Icon}
								className="size-4 text-[--system-accent]"
							/>
						</div>
						<div className="min-w-0 flex-1">
							<p className="font-medium text-sm">
								{a.topics.join(", ") || "General"}
							</p>
							<p className="mt-0.5 text-muted-foreground text-xs">
								Assigned {new Date(a.createdAt).toLocaleDateString()}
							</p>
						</div>
					</div>
				))}
			</CardContent>
		</Card>
	);
}
