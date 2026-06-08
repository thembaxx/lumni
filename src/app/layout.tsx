import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { getLocale } from "next-intl/server";
import { cn } from "@/lib/shared";
import "./globals.css";
import { fontHeading, fontMono, fontSans } from "./fonts";

export const metadata: Metadata = {
	manifest: "/manifest.json",
	icons: {
		icon: "/favicon.ico",
		apple: "/apple-touch-icon.png",
	},
};

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
					// react-doctor will-fix: theme FOUC prevention — no user input, hardcoded inline script
					// biome-ignore lint/security/noDangerouslySetInnerHtml: theme FOUC prevention
					dangerouslySetInnerHTML={{
						__html: `(function(){try{var t=localStorage.getItem("theme");if(t==="dark"){document.documentElement.classList.add("dark");document.documentElement.style.colorScheme="dark"}else if(t==="light"){document.documentElement.classList.remove("dark");document.documentElement.style.colorScheme="light"}else{if(window.matchMedia("(prefers-color-scheme:dark)").matches){document.documentElement.classList.add("dark");document.documentElement.style.colorScheme="dark"}else{document.documentElement.classList.remove("dark");document.documentElement.style.colorScheme="light"}}}catch(e){}})()`,
					}}
				/>
				<Script
					id="sw-cleanup"
					strategy="beforeInteractive"
					// biome-ignore lint/security/noDangerouslySetInnerHtml: dev SW cleanup
					dangerouslySetInnerHTML={{
						__html:
							'if(location.hostname==="localhost"&&"serviceWorker"in navigator){navigator.serviceWorker.getRegistrations().then(function(rs){for(var i=0;i<rs.length;i++){rs[i].unregister()}});navigator.serviceWorker.register("/sw.js").then(function(){navigator.serviceWorker.getRegistrations().then(function(rs){for(var i=0;i<rs.length;i++){rs[i].unregister()}})})}',
					}}
				/>
				{children}
			</body>
		</html>
	);
}
