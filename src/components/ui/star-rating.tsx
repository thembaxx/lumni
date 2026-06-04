"use client";

import { StarIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { cn } from "@/lib/shared";
import { Button } from "./button";

interface StarRatingProps {
	initialRating?: number;
	onRate: (rating: number) => void;
	disabled?: boolean;
	size?: number;
}

export function StarRating({
	initialRating = 0,
	onRate,
	disabled = false,
	size = 20,
}: StarRatingProps) {
	const [hovered, setHovered] = useState(0);

	const handleClick = (rating: number) => {
		if (disabled) return;
		onRate(rating);
	};

	return (
		<div className="flex items-center gap-0.5">
			{[1, 2, 3, 4, 5].map((star) => {
				const active = star <= (hovered || initialRating);
				return (
					<Button
						key={star}
						variant="ghost"
						size="icon"
						type="button"
						disabled={disabled}
						className="h-auto w-auto p-0.5"
						aria-label={`Rate ${star} out of 5 stars`}
						onMouseEnter={() => !disabled && setHovered(star)}
						onMouseLeave={() => setHovered(0)}
						onClick={() => handleClick(star)}
					>
						<HugeiconsIcon
							icon={StarIcon}
							size={size}
							className={cn(
								"transition-colors",
								active
									? "fill-amber-400 text-amber-400 dark:fill-amber-300 dark:text-amber-300"
									: "text-muted-foreground/30",
							)}
						/>
					</Button>
				);
			})}
		</div>
	);
}
