"use client";

import { FlashIcon, SparklesIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { m } from "framer-motion";
import { useEffect, useState } from "react";
import { Anim } from "@/components/shared/anim";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/shared";

export function SuccessBadge({ isAdmin }: { isAdmin: boolean }) {
	const [show, setShow] = useState(true);

	useEffect(() => {
		const timer = setTimeout(() => setShow(false), 2000);
		return () => clearTimeout(timer);
	}, []);

	if (!show) return null;

	return (
		<Anim>
			<m.div
				className="absolute -top-1 -right-1"
				initial={{ scale: 0.95, opacity: 0 }}
				animate={{
					scale: 1,
					opacity: 1,
					transition: {
						type: "spring",
						stiffness: 400,
						damping: 15,
					},
				}}
				exit={{ scale: 0.95, opacity: 0 }}
			>
				<div className="relative">
					<div className="absolute inset-0 animate-ping opacity-75">
						<HugeiconsIcon
							icon={SparklesIcon}
							className="size-4 text-warning-foreground"
						/>
					</div>
					<HugeiconsIcon
						icon={SparklesIcon}
						className="relative z-elevated size-4 text-warning"
					/>
				</div>
			</m.div>

			<m.div
				className="absolute -right-1 -bottom-1"
				initial={{ scale: 0.95, opacity: 0 }}
				animate={{
					scale: 1,
					opacity: 1,
					transition: {
						type: "spring",
						stiffness: 400,
						damping: 15,
						delay: 0.1,
					},
				}}
				exit={{ scale: 0.95, opacity: 0 }}
			>
				<Badge
					variant={isAdmin ? "default" : "secondary"}
					className={cn(
						"gap-1 px-2 font-medium text-[10px]",
						isAdmin && "bg-success/20 text-success-foreground",
					)}
				>
					<HugeiconsIcon icon={FlashIcon} className="size-3" />
					{isAdmin ? "Admin" : "Welcome"}
				</Badge>
			</m.div>
		</Anim>
	);
}
