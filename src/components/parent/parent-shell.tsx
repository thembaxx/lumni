"use client";

import type { ReactNode } from "react";
import { AppErrorBoundary } from "@/components/shared/app-error-boundary";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/shared";

interface ParentShellProps {
	children: ReactNode;
	className?: string;
	isLoading?: boolean;
	hasConsent?: boolean;
}

export function ParentShell({
	children,
	className,
	isLoading = false,
	hasConsent = false,
}: ParentShellProps) {
	if (isLoading) {
		return (
			<div
				className={cn("flex min-h-screen flex-col gap-6 p-4 md:p-8", className)}
			>
				<Skeleton className="h-12 w-3/4 rounded-xl" />
				<Skeleton className="h-64 rounded-3xl" />
				<Skeleton className="h-96 rounded-3xl" />
			</div>
		);
	}

	return (
		<AppErrorBoundary>
			<div
				className={cn(
					"flex min-h-screen flex-col gap-6 bg-background p-4 md:p-8",
					className,
				)}
			>
				{!hasConsent && (
					<Card className="border-warning bg-warning/10 p-4">
						<p className="text-sm text-warning-foreground">
							Parental consent is required to view student progress. Please
							complete the consent flow below.
						</p>
					</Card>
				)}
				{children}
			</div>
		</AppErrorBoundary>
	);
}
