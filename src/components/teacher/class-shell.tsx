"use client";

import { BookOpen01Icon, TeacherIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { PageContainer } from "@/components/layout/page-container";
import { AppErrorBoundary } from "@/components/shared/app-error-boundary";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/shared";

interface ClassShellProps extends React.ComponentProps<"div"> {
	className?: string;
	isLoading?: boolean;
	role?: "teacher" | "admin";
	children: React.ReactNode;
}

export function ClassShell({
	children,
	className,
	isLoading = false,
	role = "teacher",
}: ClassShellProps) {
	if (isLoading) {
		return (
			<div
				className={cn("flex min-h-screen flex-col gap-6 p-4 md:p-8", className)}
			>
				<Skeleton className="h-12 w-3/4 rounded-xl" />
				<Skeleton className="h-64 rounded-[2rem]" />
				<Skeleton className="h-96 rounded-[2rem]" />
			</div>
		);
	}

	return (
		<AppErrorBoundary>
			<div
				className={cn(
					"flex min-h-screen flex-col gap-6 bg-background py-4 md:py-8",
					className,
				)}
			>
				<PageContainer variant="wide" className="gap-6">
					<div className="flex items-center gap-3">
						<HugeiconsIcon
							icon={role === "admin" ? BookOpen01Icon : TeacherIcon}
							size={28}
							className="text-primary"
						/>
						<h1 className="font-semibold font-heading text-2xl tracking-tight">
							{role === "admin" ? "School Analytics" : "Teacher Dashboard"}
						</h1>
					</div>
					{children}
				</PageContainer>
			</div>
		</AppErrorBoundary>
	);
}
