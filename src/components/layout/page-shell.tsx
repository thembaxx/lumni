import * as React from "react";

import { cn } from "@/lib/utils";

interface PageShellProps {
	children: React.ReactNode;
	title?: string;
	className?: string;
}

function PageShell({ children, title, className }: PageShellProps) {
	return (
		<div
			className={cn(
				"min-h-screen bg-[--system-background] pb-[calc(var(--space-16)+var(--space-5))]",
				className,
			)}
		>
			{title && (
				<div className="sticky top-0 z-10 bg-[--system-background]/90 backdrop-blur-[--system-blur] pt-safe">
					<div className="max-w-md mx-auto px-[--space-4] py-[--space-3]">
						<h1 className="ios-large-title text-[--system-text-primary]">
							{title}
						</h1>
					</div>
				</div>
			)}
			<div className="max-w-md mx-auto">{children}</div>
		</div>
	);
}

export { PageShell };
