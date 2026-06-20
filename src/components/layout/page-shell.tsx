import type * as React from "react";

import { NavigationBar } from "@/components/ui/navigation-bar";
import { cn } from "@/lib/utils";

interface PageShellProps {
	children: React.ReactNode;
	title?: string;
	subtitle?: string;
	showBack?: boolean;
	rightAction?: React.ReactNode;
	bottomSection?: React.ReactNode;
	className?: string;
	innerClassName?: string;
}

function PageShell({
	children,
	title,
	subtitle,
	showBack,
	rightAction,
	bottomSection,
	className,
	innerClassName,
}: PageShellProps) {
	const basePadding =
		"pb-[calc(var(--space-16)+var(--space-5)+var(--spacing-safe-pb,0px))]";

	if (!title) {
		return (
			<div
				className={cn("min-h-dvh bg-system-background", basePadding, className)}
			>
				<div className={cn("mx-auto max-w-md", innerClassName)}>{children}</div>
			</div>
		);
	}

	return (
		<div
			className={cn("min-h-dvh bg-system-background", basePadding, className)}
		>
			<NavigationBar
				title={title}
				subtitle={subtitle}
				showBack={showBack}
				rightAction={rightAction}
				bottomSection={bottomSection}
			/>
			<div className={cn("mx-auto max-w-md", innerClassName)}>{children}</div>
		</div>
	);
}

export { PageShell };
