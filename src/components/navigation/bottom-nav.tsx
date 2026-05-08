"use client";

import {
	GridIcon as FlashcardIcon,
	GridIcon,
	Home05Icon,
	Mic01Icon,
	Settings02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { PracticeSheet } from "@/components/dashboard/practice/practice-sheet";
import { useNavigationDirection } from "@/hooks/use-navigation-direction";
import { cn } from "@/lib/utils";

interface NavItem {
	id: string;
	label: string;
	icon: IconSvgElement;
	href: string;
}

const navItems: NavItem[] = [
	{
		id: "home",
		label: "Home",
		icon: Home05Icon,
		href: "/dashboard",
	},
	{
		id: "quiz",
		label: "Quiz",
		icon: GridIcon,
		href: "/quiz",
	},
	{
		id: "flashcards",
		label: "Cards",
		icon: FlashcardIcon,
		href: "/flashcards",
	},
	{
		id: "practice",
		label: "Practice",
		icon: Mic01Icon,
		href: "",
	},
	{
		id: "settings",
		label: "Settings",
		icon: Settings02Icon,
		href: "/admin",
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
		<motion.button
			onClick={onClick}
			className={cn(
				"flex flex-1 flex-col items-center justify-center gap-1.5 py-2 px-1 min-h-[48px] rounded-xl transition-colors relative",
				isActive
					? "text-primary"
					: "text-muted-foreground hover:text-foreground",
			)}
			whileTap={{ scale: 0.92 }}
			transition={{ duration: 0.15 }}
		>
			<AnimatePresence mode="wait">
				{isActive && (
					<motion.div
						layoutId="activeIndicator"
						className="absolute inset-0 bg-primary/10 rounded-xl"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
					/>
				)}
			</AnimatePresence>
			<div className="relative z-10">
				<HugeiconsIcon
					icon={item.icon}
					className={cn(
						"w-5 h-5 transition-transform duration-200",
						isActive && "scale-110",
					)}
				/>
			</div>
			<span
				className={cn(
					"text-[10px] font-medium tracking-wide transition-all duration-200",
					isActive ? "text-primary" : "text-muted-foreground",
				)}
			>
				{item.label}
			</span>
			{isActive && (
				<motion.div
					layoutId="activeDot"
					className="absolute -bottom-1 w-1 h-1 rounded-full bg-primary"
					transition={{ type: "spring", stiffness: 300, damping: 30 }}
				/>
			)}
		</motion.button>
	);
}

export function BottomNav() {
	const pathname = usePathname();
	const { push } = useNavigationDirection();
	const [practiceDrawerOpen, setPracticeDrawerOpen] = useState(false);

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
			if (item.id === "practice" || item.id === "quiz") {
				setPracticeDrawerOpen(true);
			} else {
				push(item.href);
			}
		},
		[push],
	);

	return (
		<>
			<motion.nav
				className="fixed bottom-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-t border-border/50 md:hidden"
				initial={{ y: 100, opacity: 0 }}
				animate={{ y: 0, opacity: 1 }}
				transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.2 }}
			>
				<div className="flex w-full px-2 pb-safe">
					{navItems.map((item, index) => (
						<NavItemComponent
							key={item.id}
							item={item}
							isActive={index === activeIndex}
							onClick={() => handleItemClick(item)}
						/>
					))}
				</div>
				<div
					className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-border/50 to-transparent"
					aria-hidden="true"
				/>
			</motion.nav>
			<PracticeSheet
				open={practiceDrawerOpen}
				onOpenChange={setPracticeDrawerOpen}
			/>
		</>
	);
}
