"use client";

import Image from "next/image";

export function DashboardHero() {
	return (
		<main className="flex flex-1 flex-col items-center justify-center px-4">
			<Image
				src="/logo.png"
				alt=""
				width={48}
				height={48}
				sizes="48px"
				className="mb-6 animate-fade-in-up outline outline-black/10 -outline-offset-1 delay-50 dark:outline-white/10"
			/>
		</main>
	);
}
