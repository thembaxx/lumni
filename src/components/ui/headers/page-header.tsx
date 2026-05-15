"use client";

import { cn } from "@/lib/shared";

interface PageHeaderProps {
	title: string;
	subtitle?: string;
	leftSection?: React.ReactNode;
	rightSection?: React.ReactNode;
	bottomSection?: React.ReactNode;
	className?: string;
}

function PageHeader({
	title,
	subtitle,
	leftSection,
	rightSection,
	bottomSection,
	className,
}: PageHeaderProps) {
	return (
		<header
			className={cn(
				"sticky top-0 z-10 flex flex-col gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
				"animate-fade-in-up",
				className,
			)}
		>
			<div className="flex h-14 items-center gap-3 px-4">
				{leftSection && <div className="shrink-0">{leftSection}</div>}
				<div className="flex min-w-0 flex-1 flex-col justify-center">
					<h1 className="truncate text-base font-semibold text-foreground">
						{title}
					</h1>
					{subtitle && (
						<p className="truncate text-xs text-muted-foreground">{subtitle}</p>
					)}
				</div>
				{rightSection && (
					<div className="ml-auto flex shrink-0 items-center gap-2">
						{rightSection}
					</div>
				)}
			</div>
			{bottomSection && <div className="px-4 pb-2">{bottomSection}</div>}
		</header>
	);
}

export { PageHeader };
