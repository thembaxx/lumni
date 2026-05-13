"use client";

import { Icon } from "@iconify/react";
import { domAnimation, LazyMotion, m } from "framer-motion";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChatDialog } from "@/components/dashboard/chat/chat-dialog";
import { PracticeSheet } from "@/components/dashboard/practice/practice-sheet";
import { Button } from "@/components/ui/button";
import { useNavigationDirection } from "@/hooks/use-navigation-direction";
import { cn } from "@/lib/utils";

interface NavItem {
	id: string;
	label: string;
	icon: string;
	href: string;
}

const navItems: NavItem[] = [
	{
		id: "home",
		label: "Home",
		icon: "fluent:home-24-filled",
		href: "/dashboard",
	},
	{
		id: "syllabus",
		label: "Syllabus",
		icon: "fluent:notebook-24-filled",
		href: "/quiz",
	},
	{
		id: "chat",
		label: "Chat",
		icon: "fluent:chat-sparkle-24-filled",
		href: "",
	},
	{
		id: "practice",
		label: "Practice",
		icon: "fluent:learning-app-24-filled",
		href: "",
	},
	{
		id: "settings",
		label: "Settings",
		icon: "fluent:person-24-filled",
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
		<Button
			variant="ghost"
			onClick={onClick}
			data-nav-item
			className={cn(
				"flex flex-1 flex-col items-center justify-center gap-1 px-2 h-auto rounded-none min-h-0 py-0 transition-colors duration-300 relative z-10",
				isActive
					? "text-system-accent"
					: "text-muted-foreground/25 hover:text-muted-foreground/40",
			)}
		>
			<m.span
				className="flex items-center justify-center relative"
				animate={isActive ? { scale: 1.1, y: -2 } : { scale: 0.9, y: 0 }}
				transition={{ type: "spring", stiffness: 400, damping: 25, mass: 0.5 }}
			>
				<Icon icon={item.icon} className={cn("size-6", isActive ? "text-system-accent" : "text-muted-foreground/40")} />
			</m.span>
			<span
				className={cn(
					"text-[10px] font-black tracking-tight uppercase transition-all duration-300",
					isActive ? "opacity-100 translate-y-0" : "opacity-40 translate-y-0.5",
				)}
			>
				{item.label}
			</span>
		</Button>
	);
}

export function BottomNav() {
	const pathname = usePathname();
	const { push } = useNavigationDirection();
	const [practiceDrawerOpen, setPracticeDrawerOpen] = useState(false);
	const [chatDialogOpen, setChatDialogOpen] = useState(false);
	const listRef = useRef<HTMLDivElement>(null);
	const [indicator, setIndicator] = useState({ left: 0, width: 0 });

	const activeIndex = useMemo(() => {
		const index = navItems.findIndex((item) => {
			if (item.href === "/dashboard") {
				return pathname === "/dashboard" || pathname === "/";
			}
			return pathname.startsWith(item.href);
		});
		return index >= 0 ? index : 0;
	}, [pathname]);

	const measure = useCallback(() => {
		if (!listRef.current) return;
		const buttons =
			listRef.current.querySelectorAll<HTMLButtonElement>("[data-nav-item]");
		const btn = buttons[activeIndex];
		if (!btn) return;
		const listRect = listRef.current.getBoundingClientRect();
		const btnRect = btn.getBoundingClientRect();
		setIndicator({
			left: btnRect.left - listRect.left,
			width: btnRect.width,
		});
	}, [activeIndex]);

	useEffect(() => {
		requestAnimationFrame(measure);
	}, [measure]);

	const handleItemClick = useCallback(
		(item: NavItem) => {
			if (item.id === "chat") {
				setChatDialogOpen(true);
			} else if (item.id === "practice") {
				setPracticeDrawerOpen(true);
			} else {
				push(item.href);
			}
		},
		[push],
	);

	if (pathname === "/") return null;

	return (
		<>
			<LazyMotion features={domAnimation}>
				<nav className="fixed bottom-0 left-0 right-0 z-50 h-[64px] bg-system-background/95 backdrop-blur-md border-t border-border/40 md:hidden pb-safe">
					<div
						ref={listRef}
						className="relative flex w-full h-full items-center px-1.5"
					>
						{navItems.map((item, index) => (
							<NavItemComponent
								key={item.id}
								item={item}
								isActive={index === activeIndex}
								onClick={() => handleItemClick(item)}
							/>
						))}
						<m.div
							className="absolute top-1/2 -translate-y-1/2 h-10 rounded-2xl bg-system-accent/8 z-0"
							initial={false}
							animate={{
								left: indicator.left + 6,
								width: indicator.width - 12,
							}}
							transition={{
								type: "spring",
								stiffness: 400,
								damping: 35,
							}}
						/>
					</div>
				</nav>
			</LazyMotion>
			<PracticeSheet
				open={practiceDrawerOpen}
				onOpenChange={setPracticeDrawerOpen}
			/>
			<ChatDialog open={chatDialogOpen} onOpenChange={setChatDialogOpen} />
		</>
	);
}
