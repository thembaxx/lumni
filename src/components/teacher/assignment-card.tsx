"use client";

import { LinkSquare01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/shared";
import { logError } from "@/lib/shared/logger";

interface AssignmentCardProps {
	assignmentId: string;
	topic: string;
	questionCount: number;
	dueDate?: string;
	className?: string;
}

export function AssignmentCard({
	assignmentId,
	topic,
	questionCount,
	dueDate,
	className,
}: AssignmentCardProps) {
	const [copied, setCopied] = useState(false);

	const handleShare = async () => {
		try {
			const res = await fetch("/api/teacher/share-assignment", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ assignmentId, topic, questionCount, dueDate }),
			});
			if (!res.ok) throw new Error("Failed to share");
			const { url } = (await res.json()) as { url: string };
			await navigator.clipboard.writeText(`${window.location.origin}${url}`);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (err) {
			logError("AssignmentCardShare", err);
		}
	};

	return (
		<Card className={cn(className)}>
			<CardHeader className="pb-2">
				<CardTitle className="font-heading text-sm">{topic}</CardTitle>
			</CardHeader>
			<CardContent className="flex items-center justify-between gap-2">
				<p className="text-muted-foreground text-xs">
					{questionCount} question{questionCount !== 1 ? "s" : ""}
					{dueDate && (
						<> &middot; Due {new Date(dueDate).toLocaleDateString()}</>
					)}
				</p>
				<Button
					size="sm"
					variant="outline"
					onClick={handleShare}
					className="h-8 gap-1.5 text-xs"
				>
					<HugeiconsIcon icon={LinkSquare01Icon} className="size-3.5" />
					{copied ? "Copied!" : "Share"}
				</Button>
			</CardContent>
		</Card>
	);
}
