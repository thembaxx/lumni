"use client";

import { RadialIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { m } from "framer-motion";
import { cn } from "@/lib/shared";

interface AdminActionButtonProps {
	children: React.ReactNode;
	onClick: () => void;
	loading?: boolean;
	disabled?: boolean;
	variant?: "default" | "outline";
	icon?: React.ReactNode;
}

export function AdminActionButton({
	children,
	onClick,
	loading,
	disabled,
	variant = "default",
	icon,
}: AdminActionButtonProps) {
	return (
		<m.button
			onClick={onClick}
			disabled={loading || disabled}
			whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
			whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
			className={cn(
				"flex-1 rounded-md px-3 py-2 font-medium text-sm transition-colors disabled:opacity-50",
				variant === "default"
					? "bg-foreground text-background"
					: "border bg-transparent",
			)}
		>
			<m.span
				animate={loading ? { opacity: 0.7 } : { opacity: 1 }}
				className="flex items-center justify-center gap-2"
			>
				{loading && (
					<HugeiconsIcon icon={RadialIcon} className="size-3 animate-spin" />
				)}
				{icon && icon}
				{children}
			</m.span>
		</m.button>
	);
}
