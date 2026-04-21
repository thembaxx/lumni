"use client";

import { IconChevronRight } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import { appConfig } from "../../../../app.config";

export function DashboardHero() {
	return (
		<main className="flex-1 flex flex-col items-center justify-center px-4">
			<Image
				src="/logo.png"
				alt="Hero Image"
				width={48}
				height={48}
				className="mb-6 animate-fade-in-up delay-50"
			/>
			<h1 className="text-3xl font-semibold tracking-tight text-center animate-fade-in-up delay-100 text-balance">
				{appConfig.name}
			</h1>
			<p className="text-muted-foreground text-sm text-center mt-2 animate-fade-in-up delay-200">
				{appConfig.descriptionShort}
			</p>
			<Link
				href="/chat"
				className="mt-6 text-sm flex items-center font-medium text-primary hover:text-primary/80 transition-colors duration-200 animate-fade-in-up delay-300 group"
			>
				<span className="relative">
					Learn more
					<span className="absolute left-0 bottom-0 w-full h-px bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
				</span>
				<IconChevronRight
					size={16}
					className="ml-1 mt-0.5 transition-transform duration-200 group-hover:translate-x-1"
				/>
			</Link>
		</main>
	);
}
