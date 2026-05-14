"use client";

import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { m, useMotionValueEvent, useScroll } from "framer-motion";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface NavigationBarProps {
	title: string;
	subtitle?: string;
	showBack?: boolean;
	rightAction?: React.ReactNode;
	bottomSection?: React.ReactNode;
	className?: string;
}

export function NavigationBar({
	title,
	subtitle,
	showBack,
	rightAction,
	bottomSection,
	className,
}: NavigationBarProps) {
	const router = useRouter();
	const ref = useRef<HTMLDivElement>(null);
	const { scrollY } = useScroll();
	const [isCollapsed, setIsCollapsed] = useState(false);

	useMotionValueEvent(scrollY, "change", (latest) => {
		setIsCollapsed(latest > 20);
	});

	return (
		<header
			ref={ref}
			className={cn(
				"sticky top-0 z-20 w-full transition-all duration-200",
				isCollapsed ? "shadow-sm" : "",
				className,
			)}
		>
			{/* Background layer */}
			<div
				className={cn(
					"absolute inset-0 transition-all duration-200",
					isCollapsed
						? "bg-system-background/90 backdrop-blur-xl"
						: "bg-system-background/0",
				)}
			/>

			{/* Separator — appears when collapsed */}
			<m.div
				className="absolute bottom-0 left-0 right-0 h-[0.5px] bg-system-separator/50"
				animate={{ opacity: isCollapsed ? 1 : 0 }}
				transition={{ duration: 0.2 }}
			/>

			{/* Content */}
			<div className="relative px-4 pt-safe">
				{/* Main row */}
				<div className="flex items-center gap-3 h-[52px]">
					{/* Back button */}
					{showBack && (
						<button
							type="button"
							onClick={() => router.back()}
							className="flex items-center justify-center size-9 -ml-1.5 text-system-accent active:opacity-60 transition-opacity"
							aria-label="Go back"
						>
							<HugeiconsIcon
								icon={ArrowLeft01Icon}
								className="size-5"
								strokeWidth={2}
							/>
						</button>
					)}

					{/* Title area */}
					<div className="flex-1 min-w-0">
						<m.h1
							className={cn(
								"font-heading font-extrabold text-system-text-primary truncate transition-all duration-200",
								isCollapsed
									? "text-base leading-6"
									: "text-[34px] leading-[1.2] tracking-[var(--tracking-large-title)]",
							)}
						>
							{title}
						</m.h1>
						{subtitle && !isCollapsed && (
							<p className="text-sm text-system-text-secondary mt-0.5">
								{subtitle}
							</p>
						)}
					</div>

					{/* Right action */}
					{rightAction && (
						<div className="flex items-center gap-2 shrink-0">
							{rightAction}
						</div>
					)}
				</div>

				{/* Bottom section (e.g., tabs, search) */}
				{bottomSection && (
					<div className={cn("pb-2", isCollapsed && "hidden")}>
						{bottomSection}
					</div>
				)}
			</div>
		</header>
	);
}
