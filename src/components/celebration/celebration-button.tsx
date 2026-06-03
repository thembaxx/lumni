"use client";

import type { ButtonHTMLAttributes } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/shared";

const VARIANT_STYLES = {
	correct: "bg-success hover:bg-success/90 text-primary-foreground",
	incorrect: "bg-destructive hover:bg-destructive/90 text-primary-foreground",
	default: "",
} as const;

interface CelebrationButtonProps
	extends ButtonHTMLAttributes<HTMLButtonElement> {
	variantBtn?: keyof typeof VARIANT_STYLES;
	celebrateOnClick?: boolean;
}

export function CelebrationButton({
	className,
	variantBtn = "default",
	celebrateOnClick,
	children,
	onClick,
	ref,
	...props
}: CelebrationButtonProps & { ref?: React.Ref<HTMLButtonElement> }) {
	const handleCelebrationClick = (e: React.MouseEvent<HTMLButtonElement>) => {
		if (celebrateOnClick && onClick) {
			const target = e.currentTarget;
			target.classList.add("animate-celebrate");
			setTimeout(() => target.classList.remove("animate-celebrate"), 400);
		}
		onClick?.(e);
	};

	return (
		<Button
			ref={ref}
			className={cn(
				"relative font-medium transition-colors",
				VARIANT_STYLES[variantBtn],
				className,
			)}
			onClick={handleCelebrationClick}
			{...props}
		>
			{children}
		</Button>
	);
}
