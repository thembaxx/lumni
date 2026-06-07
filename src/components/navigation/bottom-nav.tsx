"use client";

import { Home01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, m } from "framer-motion";
import { memo, useCallback, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { useNavigationDirection } from "@/hooks/use-navigation-direction";
import { usePathname } from "@/i18n/navigation";
import type { NavItem as ConfigNavItem } from "@/lib/navigation/config";
import { getPrimaryItems } from "@/lib/navigation/config";
import { cn } from "@/lib/shared";

interface BottomNavItem {
	id: string;
	label: string;
	icon: ConfigNavItem["icon"];
	href: string;
	badge?: number;
}

const navItems: BottomNavItem[] = [
	{
		id: "home",
		label: "Home",
		icon: Home01Icon,
		href: "/dashboard",
	},
	...getPrimaryItems().map((item) => ({
		id: item.id,
		label: item.label,
		icon: item.icon,
		href: item.route,
	})),
];

const NavItemComponent = memo(function NavItemComponent({
	item,
	isActive,
	onNavigate,
}: {
	item: BottomNavItem;
	isActive: boolean;
	onNavigate: (href: string) => void;
}) {
	return (
		<m.button
			type="button"
			onClick={() => onNavigate(item.href)}
			aria-label={item.label}
			aria-current={isActive ? "page" : undefined}
			className="relative m-0 flex h-full min-w-0 flex-1 cursor-pointer flex-col items-center justify-center gap-0.5 border-none bg-transparent p-0 text-inherit focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--system-accent] focus-visible:ring-inset"
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
						className="ios-caption-3 absolute -top-1 -right-1.5 h-4 min-w-4 border-0 px-1 leading-none"
					>
						{item.badge > 99 ? "99+" : item.badge}
					</Badge>
				)}
			</div>
			<span
				className={cn(
					"ios-caption-3 relative z-elevated text-center font-medium uppercase leading-none tracking-(--tracking-caption-1) transition-colors duration-200",
					isActive ? "text-system-accent" : "text-system-text-tertiary",
				)}
			>
				{item.label}
			</span>
		</m.button>
	);
});

export function BottomNav() {
	const pathname = usePathname();
	const { push } = useNavigationDirection();

	const activeIndex = useMemo(() => {
		const index = navItems.findIndex((item) => {
			if (item.href === "/dashboard") {
				return pathname === "/dashboard" || pathname === "/";
			}
			return pathname.startsWith(item.href);
		});
		return index >= 0 ? index : 0;
	}, [pathname]);

	const handleNavigate = useCallback(
		(href: string) => {
			push(href);
		},
		[push],
	);

	return (
		<nav
			aria-label="Main navigation"
			className="fixed right-0 bottom-0 left-0 z-header flex w-full"
			style={{
				height: "calc(49px + var(--spacing-safe-pb, 0px))",
			}}
		>
			<div className="relative grid h-12.25 w-full grow grid-cols-6 items-stretch border-system-separator/30 border-t bg-system-background/80 backdrop-blur-xl before:pointer-events-none before:absolute before:inset-0 before:bg-(--system-accent-alpha-10)">
				{navItems.map((item, index) => (
					<NavItemComponent
						key={item.id}
						item={item}
						onNavigate={handleNavigate}
						isActive={index === activeIndex}
					/>
				))}
			</div>
		</nav>
	);
}
