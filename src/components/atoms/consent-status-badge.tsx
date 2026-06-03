"use client";

import {
	CheckmarkBadge01Icon,
	HelpCircleIcon,
	UserCheck01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cva, type VariantProps } from "class-variance-authority";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/shared";

const consentStatusBadgeVariants = cva("gap-1.5 font-medium", {
	variants: {
		status: {
			granted:
				"border-success/30 bg-success/15 text-success hover:bg-success/20",
			pending:
				"border-warning/30 bg-warning/15 text-warning hover:bg-warning/20",
			revoked:
				"border-destructive/30 bg-destructive/15 text-destructive hover:bg-destructive/20",
		},
	},
	defaultVariants: {
		status: "pending",
	},
});

type ConsentStatus = "granted" | "pending" | "revoked";

const ICON_MAP: Record<ConsentStatus, typeof UserCheck01Icon> = {
	granted: UserCheck01Icon,
	pending: HelpCircleIcon,
	revoked: CheckmarkBadge01Icon,
};

const LABEL_MAP: Record<ConsentStatus, string> = {
	granted: "Consent Granted",
	pending: "Consent Pending",
	revoked: "Consent Revoked",
};

interface ConsentStatusBadgeProps
	extends React.ComponentProps<typeof Badge>,
		VariantProps<typeof consentStatusBadgeVariants> {
	status?: ConsentStatus;
}

export function ConsentStatusBadge({
	status = "pending",
	className,
	...props
}: ConsentStatusBadgeProps) {
	return (
		<Badge
			variant="outline"
			className={cn(consentStatusBadgeVariants({ status }), className)}
			{...props}
		>
			<HugeiconsIcon icon={ICON_MAP[status]} size={14} />
			{LABEL_MAP[status]}
		</Badge>
	);
}
