"use client";

import { IconChevronRight } from "@tabler/icons-react";
import Link from "next/link";
import { appConfig } from "../../../../app.config";

export function DashboardHero() {
	return (
		<main className="flex-1 flex flex-col items-center justify-center">
			<h1 className="text-2xl font-semibold tracking-tight animate-fade-in-up delay-100">
				{appConfig.name}
			</h1>
			<p className="text-muted-foreground text-sm animate-fade-in-up delay-200">
				{appConfig.descriptionShort}
			</p>
			<Link
				href="/chat"
				className="mt-4 text-xs flex items-center font-medium text-primary hover:underline transition-all duration-200 animate-fade-in-up delay-300 group"
			>
				Learn more
				<IconChevronRight
					size={16}
					className="mt-0.5 transition-transform duration-200 group-hover:translate-x-1"
				/>
			</Link>
		</main>
	);
}
