"use client";

import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface IconHeaderCardProps {
	icon: LucideIcon;
	title: string;
	iconClassName?: string;
	variant?: "default" | "highlighted";
	className?: string;
	children: React.ReactNode;
}

export function IconHeaderCard({
	icon: Icon,
	title,
	iconClassName = "h-4 w-4",
	variant = "default",
	className,
	children,
}: IconHeaderCardProps) {
	const isHighlighted = variant === "highlighted";

	return (
		<Card
			className={cn(
				isHighlighted && "bg-primary/5 border-primary/20",
				className,
			)}
		>
			<CardHeader className="pb-2">
				<CardTitle className="text-base flex items-center gap-2">
					<Icon
						className={cn(iconClassName, isHighlighted && "text-primary")}
					/>
					{title}
				</CardTitle>
			</CardHeader>
			<CardContent>{children}</CardContent>
		</Card>
	);
}
