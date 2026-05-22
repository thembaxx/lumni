"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/shared";

const masteryBadgeVariants = cva("font-medium", {
	variants: {
		level: {
			mastered:
				"border-success/30 bg-success/15 text-success hover:bg-success/20",
			proficient:
				"border-primary/30 bg-primary/15 text-primary hover:bg-primary/20",
			developing:
				"border-warning/30 bg-warning/15 text-warning hover:bg-warning/20",
			novice: "bg-muted text-muted-foreground hover:bg-muted/80",
		},
	},
	defaultVariants: {
		level: "novice",
	},
});

interface MasteryBadgeProps
	extends React.ComponentProps<typeof Badge>,
		VariantProps<typeof masteryBadgeVariants> {
	level?: "mastered" | "proficient" | "developing" | "novice";
}

export function MasteryBadge({
	level = "novice",
	className,
	...props
}: MasteryBadgeProps) {
	const labels = {
		mastered: "Mastered",
		proficient: "Proficient",
		developing: "Developing",
		novice: "Novice",
	};

	return (
		<Badge
			variant="outline"
			className={cn(masteryBadgeVariants({ level }), className)}
			{...props}
		>
			{labels[level]}
		</Badge>
	);
}
