"use client";

import { SignIn, SignOut, User } from "@phosphor-icons/react";
import { usePathname } from "next/navigation";
import { useCallback, useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	DropdownList,
	DropdownListContent,
	DropdownListItem,
	DropdownListLabel,
	DropdownListSeparator,
	DropdownListTrigger,
} from "@/components/ui/dropdown-menu";
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

				<div className="flex items-center gap-2">
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
											src={(user?.prefs as Record<string, unknown>).avatarUrl as string}
											alt={user?.name || "User"}
										/>
									) : null}
									<AvatarFallback className="text-xs font-bold bg-system-accent text-white">
										{user?.name?.charAt(0)?.toUpperCase() || "U"}
									</AvatarFallback>
								</Avatar>
							</DropdownListTrigger>
							<DropdownListContent align="end" sideOffset={8} className="w-56">
								<DropdownListLabel className="font-normal">
									<div className="flex flex-col gap-0.5 py-1">
										<span className="text-sm font-semibold text-foreground">
											{user?.name || "User"}
										</span>
										<span className="text-xs text-muted-foreground">
											{user?.email}
										</span>
									</div>
								</DropdownListLabel>
								<DropdownListSeparator />
								<DropdownListItem
									onClick={() => {
										window.location.href = "/settings?tab=profile";
									}}
								>
									<User className="size-4" />
									Profile
								</DropdownListItem>
								<DropdownListItem
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
								<DropdownListSeparator />
								<DropdownListItem variant="destructive" onClick={handleSignOut}>
									<SignOut className="size-4" />
									Sign Out
								</DropdownListItem>
							</DropdownListContent>
						</DropdownList>
					)}
				</div>
			</div>
		</header>
	);
}
