import { getLocale } from "next-intl/server";
import type { Viewport } from "next";
import Script from "next/script";
import { cn } from "@/lib/shared";
import "./globals.css";
import { fontHeading, fontMono, fontSans } from "./fonts";

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	maximumScale: 5,
	themeColor: [
		{ media: "(prefers-color-scheme: light)", color: "#fcfaf5" },
		{ media: "(prefers-color-scheme: dark)", color: "#14141f" },
	],
};

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const locale = await getLocale();

	return (
		<html
			lang={locale}
			suppressHydrationWarning
			data-scroll-behavior="smooth"
			className={cn(
				"h-full",
				"antialiased",
				fontSans.variable,
				fontMono.variable,
				fontHeading.variable,
			)}
		>
			<body className="flex h-full min-h-full flex-col bg-[--system-background] text-[--system-text-primary] antialiased">
				<Script
					id="theme-init"
					strategy="beforeInteractive"
					// biome-ignore lint/security/noDangerouslySetInnerHtml: theme FOUC prevention
					dangerouslySetInnerHTML={{
						__html: `(function(){try{var t=localStorage.getItem("theme");if(t==="dark"){document.documentElement.classList.add("dark");document.documentElement.style.colorScheme="dark"}else if(t==="light"){document.documentElement.classList.remove("dark");document.documentElement.style.colorScheme="light"}else{if(window.matchMedia("(prefers-color-scheme:dark)").matches){document.documentElement.classList.add("dark");document.documentElement.style.colorScheme="dark"}else{document.documentElement.classList.remove("dark");document.documentElement.style.colorScheme="light"}}}catch(e){}})()`,
					}}
				/>
				{children}
			</body>
		</html>
	);
}
