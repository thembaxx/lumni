"use client";

import {
	BookOpen01Icon,
	Chat01Icon,
	Home01Icon,
	Quiz01Icon,
	Settings01Icon,
	UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, m } from "framer-motion";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { useNavigationDirection } from "@/hooks/use-navigation-direction";
import { useOnboarding } from "@/hooks/use-onboarding";
import { cn } from "@/lib/shared";

interface NavItem {
	id: string;
	label: string;
	icon: typeof Home01Icon;
	href: string;
	badge?: number;
}

const navItems: NavItem[] = [
	{
		id: "home",
		label: "Home",
		icon: Home01Icon,
		href: "/dashboard",
	},
	{
		id: "syllabus",
		label: "Syllabus",
		icon: Quiz01Icon,
		href: "/quiz",
	},
	{
		id: "chat",
		label: "Chat",
		icon: Chat01Icon,
		href: "/chat",
	},
	{
		id: "problems",
		label: "Problems",
		icon: BookOpen01Icon,
		href: "/problems",
	},
	{
		id: "groups",
		label: "Groups",
		icon: UserGroupIcon,
		href: "/study-groups",
	},
	{
		id: "settings",
		label: "Settings",
		icon: Settings01Icon,
		href: "/settings",
	},
];

function NavItemComponent({
	item,
	isActive,
	onClick,
}: {
	item: NavItem;
	isActive: boolean;
	onClick: () => void;
}) {
	return (
		<m.button
			type="button"
			onClick={onClick}
			aria-label={item.label}
			aria-current={isActive ? "page" : undefined}
			className="relative m-0 flex h-full min-w-0 flex-1 cursor-pointer flex-col items-center justify-center gap-0.5 border-none bg-transparent p-0 text-inherit outline-none"
			whileTap={{ scale: 0.96 }}
			transition={{ type: "spring", duration: 0.25, bounce: 0 }}
		>
			<AnimatePresence initial={false} mode="wait">
				{isActive && (
					<m.div
						layoutId="activeIndicator"
						className="absolute inset-0 mx-1.5 mb-1 rounded-md bg-system-accent/10"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
					/>
				)}
			</AnimatePresence>
			<div className="relative z-elevated mb-1.5 flex size-6 items-center justify-center">
				<HugeiconsIcon
					icon={item.icon}
					className={cn(
						"size-5.5 transition-[transform,color] duration-200",
						isActive && "scale-110",
						isActive ? "text-system-accent" : "text-system-text-tertiary",
					)}
				/>
				{item.badge !== undefined && item.badge > 0 && (
					<Badge
						variant="destructive"
						className="absolute -top-1 -right-1.5 h-4 min-w-4 border-0 px-1 text-[10px] leading-none"
					>
						{item.badge > 99 ? "99+" : item.badge}
					</Badge>
				)}
			</div>
			<span
				className={cn(
					"relative z-elevated text-center font-medium text-[10px] uppercase leading-none tracking-(--tracking-caption-1) transition-colors duration-200",
					isActive ? "text-system-accent" : "text-system-text-tertiary",
				)}
			>
				{item.label}
			</span>
		</m.button>
	);
}

export function BottomNav() {
	const pathname = usePathname();
	const { push } = useNavigationDirection();
	const { isOnboarding } = useOnboarding();
	const [hidden, setHidden] = useState(false);
	const [reducedMotion, setReducedMotion] = useState(false);

	useEffect(() => {
		const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
		setReducedMotion(mq.matches);
		const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
		mq.addEventListener("change", handler);
		return () => mq.removeEventListener("change", handler);
	}, []);

	// biome-ignore lint/correctness/useExhaustiveDependencies: re-run on route change to reset scroll/hidden state
	useEffect(() => {
		let lastY = window.scrollY;
		let ticking = false;

		const updateScroll = () => {
			const currentY = window.scrollY;
			const delta = lastY - currentY;

			setHidden((prev) => {
				if (currentY <= 0) return false;
				if (delta < -8) return true;
				if (delta > 0) return false;
				return prev;
			});

			lastY = currentY;
			ticking = false;
		};

		const handleScroll = () => {
			if (!ticking) {
				window.requestAnimationFrame(updateScroll);
				ticking = true;
			}
		};

		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => window.removeEventListener("scroll", handleScroll);
	}, [pathname]);

	const activeIndex = useMemo(() => {
		const index = navItems.findIndex((item) => {
			if (item.href === "/dashboard") {
				return pathname === "/dashboard" || pathname === "/";
			}
			return pathname.startsWith(item.href);
		});
		return index >= 0 ? index : 0;
	}, [pathname]);

	const handleItemClick = useCallback(
		(item: NavItem) => {
			push(item.href);
		},
		[push],
	);

	if (pathname === "/" || isOnboarding) return null;

	return (
		<nav
			aria-label="Main navigation"
			className="fixed right-0 bottom-0 left-0 z-header flex w-full md:hidden"
			style={{
				height: "calc(49px + env(safe-area-inset-bottom, 0px))",
				transform: hidden ? "translateY(100%)" : "translateY(0)",
				transition: reducedMotion
					? "none"
					: hidden
						? "transform 0.225s cubic-bezier(0.22, 1, 0.36, 1)"
						: "transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
			}}
		>
			<div className="grid h-12.25 w-full grow grid-cols-5 items-stretch border-system-separator/30 border-t bg-system-background/80 backdrop-blur-xl">
				{navItems.map((item, index) => (
					<NavItemComponent
						key={item.id}
						item={item}
						isActive={index === activeIndex}
						onClick={() => handleItemClick(item)}
					/>
				))}
			</div>
		</nav>
	);
}
