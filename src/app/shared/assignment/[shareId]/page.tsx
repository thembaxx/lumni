"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface AssignmentData {
	type: string;
	assignmentId: string;
	topic: string;
	questionCount: number;
	dueDate: string | null;
}

export default function SharedAssignmentPage() {
	const { shareId } = useParams<{ shareId: string }>();
	const [data, setData] = useState<AssignmentData | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!shareId) return;
		try {
			const raw = localStorage.getItem(`lumni_shared_assignment_${shareId}`);
			if (raw) {
				setData(JSON.parse(raw) as AssignmentData);
			}
		} catch {
			/* silent */
		}
		setLoading(false);
	}, [shareId]);

	if (loading) {
		return (
			<div className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 p-6">
				<Skeleton className="h-8 w-48" />
				<Skeleton className="h-32 w-full" />
			</div>
		);
	}

	if (!data) {
		return (
			<div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-8 text-center">
				<div className="flex size-16 items-center justify-center rounded-full bg-muted">
					<span className="text-2xl">?</span>
				</div>
				<h1 className="font-bold text-xl">Assignment Not Found</h1>
				<p className="max-w-md text-muted-foreground text-sm">
					This assignment link may have expired or is invalid.
				</p>
			</div>
		);
	}

	return (
		<main className="mx-auto min-h-dvh max-w-2xl p-6">
			<div className="flex flex-col gap-6">
				<div className="flex flex-col gap-2">
					<h1 className="font-bold text-2xl tracking-tight">{data.topic}</h1>
					<p className="text-muted-foreground text-sm">
						This assignment was shared by your teacher
					</p>
				</div>

				<div className="grid grid-cols-2 gap-4">
					<div className="rounded-xl border bg-card p-4">
						<p className="text-muted-foreground text-xs uppercase tracking-wide">
							Questions
						</p>
						<p className="mt-1 font-bold text-3xl">{data.questionCount}</p>
					</div>
					<div className="rounded-xl border bg-card p-4">
						<p className="text-muted-foreground text-xs uppercase tracking-wide">
							Due Date
						</p>
						<p className="mt-1 font-bold text-3xl">
							{data.dueDate
								? new Date(data.dueDate).toLocaleDateString()
								: "No due date"}
						</p>
					</div>
				</div>
			</div>
		</main>
	);
}
