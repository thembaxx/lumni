"use client";

import { Icon } from "@phosphor-icons/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface IconHeaderCardProps {
	icon?: React.ComponentType<{ className?: string }>;
	title: string;
	iconClassName?: string;
	variant?: "default" | "highlighted";
	className?: string;
	children: React.ReactNode;
}

export function IconHeaderCard({
	icon: Icon,
	title,
	iconClassName = "size-4",
	variant = "default",
	className,
	children,
}: IconHeaderCardProps) {
	const isHighlighted = variant === "highlighted";

	return (
		<Card
			className={cn(
				isHighlighted && "bg-[--system-accent]/5 border-[--system-accent]/20",
				className,
			)}
		>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					{Icon && (
						<Icon
							className={cn(iconClassName, isHighlighted && "text-foreground")}
						/>
					)}
					{title}
				</CardTitle>
			</CardHeader>
			<CardContent>{children}</CardContent>
		</Card>
	);
}
