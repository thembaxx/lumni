import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { domAnimation, LazyMotion } from "framer-motion";
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { connection } from "next/server";
import { Suspense } from "react";
import { extractRouterConfig } from "uploadthing/server";

import "./globals.css";
import ErrorBoundary from "@/components/ErrorBoundary";
import { PageTransition } from "@/components/layout/page-transition";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { DesktopSidebar } from "@/components/navigation/desktop-sidebar";
import { TopNav } from "@/components/navigation/top-nav";
import { Providers } from "@/components/providers";
import { FloatingToolsButton } from "@/components/tools";
import { UploadDialogRenderer } from "@/components/upload/upload-dialog-renderer";
import { WebVitalsLogger } from "@/components/web-vitals";
import { cn } from "@/lib/shared";
import { ourFileRouter } from "./api/uploadthing/core";
import { fontHeading, fontMono, fontSans } from "./fonts";

async function UTSSR() {
	await connection();
	return <NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />;
}

export const metadata: Metadata = {
	title: {
		default: "Lumni",
		template: "%s | Lumni",
	},
	description:
		"Pass your Matric with confidence — AI-powered quizzes, past papers, and a personalized study planner for South African students.",
	metadataBase: new URL("https://lumni.ai"),
	robots: {
		index: true,
		follow: true,
	},
	manifest: "/manifest.json",
	icons: {
		icon: "/favicon.ico",
		apple: "/apple-touch-icon.png",
	},
	openGraph: {
		title: "Lumni",
		description:
			"Pass your Matric with confidence — AI-powered quizzes, past papers, and a personalized study planner for South African students.",
		type: "website",
		locale: "en_US",
		siteName: "Lumni",
		images: [
			{
				url: "/og-image.png",
				width: 1200,
				height: 630,
				alt: "Lumni - AI Study Companion",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "Lumni",
		description:
			"Pass your Matric with confidence — AI-powered quizzes, past papers, and a personalized study planner for South African students.",
		images: ["/og-image.png"],
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

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang="en"
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
			<body
				className={`${fontSans.variable} ${fontMono.variable} h-full antialiased min-h-full flex flex-col bg-[--system-background] text-[--system-text-primary]`}
			>
				<Script
					id="theme-init"
					strategy="beforeInteractive"
					dangerouslySetInnerHTML={{
						__html: `(function(){try{var t=localStorage.getItem("theme");if(t==="dark"){document.documentElement.classList.add("dark");document.documentElement.style.colorScheme="dark"}else if(t==="light"){document.documentElement.classList.remove("dark");document.documentElement.style.colorScheme="light"}else{if(window.matchMedia("(prefers-color-scheme:dark)").matches){document.documentElement.classList.add("dark");document.documentElement.style.colorScheme="dark"}else{document.documentElement.classList.remove("dark");document.documentElement.style.colorScheme="light"}}}catch(e){}})()`,
					}}
				/>
				<Suspense fallback={null}>
					<UTSSR />
				</Suspense>
				<Providers>
					<LazyMotion features={domAnimation}>
						<UploadDialogRenderer />
						<FloatingToolsButton />
						<WebVitalsLogger />
						<div className="flex flex-1">
							<DesktopSidebar />
							<main className="flex-1 min-w-0 flex flex-col">
								<TopNav />
								<ErrorBoundary>
									<PageTransition>{children}</PageTransition>
								</ErrorBoundary>
							</main>
						</div>
						<BottomNav />
					</LazyMotion>
				</Providers>
			</body>
		</html>
	);
}
