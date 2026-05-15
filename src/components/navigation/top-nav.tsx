"use client";

import { SignIn, SignOut, Star, User } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useCallback, useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	DropdownList,
	DropdownListContent,
	DropdownListItem,
	DropdownListSeparator,
	DropdownListTrigger,
} from "@/components/ui/dropdown-menu";
import { useGamification } from "@/hooks/use-gamification";
import { useSyncStatus } from "@/hooks/use-sync-status";
import { useAuth } from "@/lib/auth/auth-context";
import { cn } from "@/lib/utils";

interface TopNavProps {
	title?: string;
	className?: string;
}

const routeTitles: Record<string, string> = {
	"/dashboard": "Home",
	"/quiz": "Syllabus",
	"/flashcards": "Flashcards",
	"/settings": "Settings",
	"/upload": "Upload",
};

export function TopNav({ title, className }: TopNavProps) {
	const pathname = usePathname();
	const { user, status, signOut } = useAuth();
	const { levelInfo } = useGamification();
	const { isOnline, pendingCount } = useSyncStatus();

	const handleSignOut = useCallback(async () => {
		await signOut();
	}, [signOut]);

	const pageTitle = useMemo(() => {
		if (title) return title;

		const matched = Object.entries(routeTitles).find(([route]) =>
			pathname.startsWith(route),
		);
		if (matched) return matched[1];

		const slug = pathname.split("/").filter(Boolean)[0];
		if (slug) return slug.charAt(0).toUpperCase() + slug.slice(1);
		return "Lumni";
	}, [pathname, title]);

	const isAuthPage = pathname.startsWith("/auth");
	const isLanding = pathname === "/";
	const hasOwnHeader =
		pathname.startsWith("/settings") ||
		pathname.startsWith("/admin") ||
		pathname.startsWith("/dev");

	if (isAuthPage || isLanding || hasOwnHeader) return null;

	return (
		<header
			className={cn(
				"sticky top-0 z-40 bg-system-background/80 backdrop-blur-xl border-b border-system-separator/30",
				className,
			)}
		>
			<div className="flex items-center justify-between h-12 px-4">
				<h1 className="ios-headline text-foreground font-semibold tracking-tight">
					{pageTitle}
				</h1>

				{status === "authenticated" && !user?.labels?.includes("anonymous") && (
					<motion.div
						initial={{ opacity: 0, x: -8 }}
						animate={{ opacity: 1, x: 0 }}
						className="flex items-center gap-2 mr-auto ml-4"
					>
						<div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[--system-accent]/10">
							<Star weight="fill" className="size-3 text-[--system-accent]" />
							<span className="text-[11px] font-bold tabular-nums text-[--system-accent]">
								Lv.{levelInfo.level}
							</span>
						</div>
						<div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
							<motion.div
								initial={{ width: 0 }}
								animate={{ width: `${levelInfo.progress}%` }}
								transition={{ duration: 1, ease: "easeOut" }}
								className="h-full rounded-full bg-[--system-accent]"
							/>
						</div>
					</motion.div>
				)}

				<div className="flex items-center gap-2">
					{!isOnline && (
						<div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-warning/10 text-warning">
							<div className="size-1.5 rounded-full bg-warning animate-pulse" />
							<span className="text-[10px] font-medium">Offline</span>
						</div>
					)}
					{pendingCount > 0 && (
						<div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[--system-accent]/10 text-[--system-accent]">
							<div className="size-1.5 rounded-full bg-[--system-accent]" />
							<span className="text-[10px] font-medium">{pendingCount}</span>
						</div>
					)}
					{status === "loading" ? (
						<div className="size-8 rounded-full bg-system-fill animate-pulse" />
					) : status === "unauthenticated" ? (
						<Button
							variant="ghost"
							size="sm"
							onClick={() => {
								const redirect = encodeURIComponent(pathname);
								window.location.href = `/auth/sign-in?redirect=${redirect}`;
							}}
							className="h-8 px-3 rounded-full text-sm font-semibold text-system-accent hover:bg-system-accent/10"
						>
							<SignIn className="size-4 mr-1.5" />
							Sign In
						</Button>
					) : (
						<DropdownList>
							<DropdownListTrigger className="outline-none">
								<Avatar className="size-8 cursor-pointer ring-2 ring-transparent hover:ring-system-accent/30 transition-shadow">
									{(user?.prefs as Record<string, unknown>)?.avatarUrl ? (
										<AvatarImage
											src={
												(user?.prefs as Record<string, unknown>)
													.avatarUrl as string
											}
											alt={user?.name || "User"}
										/>
									) : null}
									<AvatarFallback className="text-xs font-bold bg-system-accent text-white">
										{user?.name?.charAt(0)?.toUpperCase() || "U"}
									</AvatarFallback>
								</Avatar>
							</DropdownListTrigger>
							<DropdownListContent align="end" sideOffset={8} className="w-56">
								<div className="px-3 py-2.5 border-b border-border/30">
									<div className="text-sm font-semibold text-foreground">
										{user?.name || "Anonymous"}
									</div>
									<div className="text-xs text-muted-foreground mt-0.5">
										{user?.email || "Email not available"}
									</div>
								</div>
								<div className="p-1">
									<DropdownListItem
										className="rounded-md"
										onClick={() => {
											window.location.href = "/settings?tab=profile";
										}}
									>
										<User className="size-4" />
										View Profile
									</DropdownListItem>
									<DropdownListItem
										className="rounded-md"
										onClick={() => {
											window.location.href = "/settings";
										}}
									>
										<svg
											className="size-4"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											strokeWidth="2"
										>
											<circle cx="12" cy="12" r="3" />
											<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
										</svg>
										Settings
									</DropdownListItem>
								</div>
								<DropdownListSeparator />
								<div className="p-1">
									<DropdownListItem
										variant="destructive"
										onClick={handleSignOut}
									>
										<SignOut className="size-4" />
										Sign Out
									</DropdownListItem>
								</div>
							</DropdownListContent>
						</DropdownList>
					)}
				</div>
			</div>
		</header>
	);
}
