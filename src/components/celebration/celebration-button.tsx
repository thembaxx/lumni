"use client";

import { motion } from "framer-motion";
import { type ButtonHTMLAttributes, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CelebrationButtonProps
	extends ButtonHTMLAttributes<HTMLButtonElement> {
	variantBtn?: "correct" | "incorrect" | "default";
	celebrateOnClick?: boolean;
}

export const CelebrationButton = forwardRef<
	HTMLButtonElement,
	CelebrationButtonProps
>(
	(
		{
			className,
			variantBtn = "default",
			celebrateOnClick,
			children,
			onClick,
			...props
		},
		ref,
	) => {
		const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
			if (celebrateOnClick && onClick) {
				const target = e.currentTarget;
				target.classList.add("animate-celebrate");
				setTimeout(() => target.classList.remove("animate-celebrate"), 400);
			}
			onClick?.(e);
		};

		const variantStyles = {
			correct: "bg-green-500 hover:bg-green-600 text-white",
			incorrect: "bg-red-500 hover:bg-red-600 text-white",
			default: "",
		};

		return (
			<Button
				ref={ref}
				className={cn(
					"relative font-medium transition-colors",
					variantStyles[variantBtn],
					className,
				)}
				onClick={handleClick}
				{...props}
			>
				{children}
			</Button>
		);
	},
);

CelebrationButton.displayName = "CelebrationButton";
