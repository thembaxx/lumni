import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { domAnimation, LazyMotion } from "framer-motion";
import type { Metadata, Viewport } from "next";
import dynamic from "next/dynamic";
import Script from "next/script";
import { connection } from "next/server";
import { Suspense } from "react";
import { extractRouterConfig } from "uploadthing/server";

import "./globals.css";
import ErrorBoundary from "@/components/ErrorBoundary";
import { PageTransition } from "@/components/layout/page-transition";
import { Providers } from "@/components/providers";
import { CardSkeleton } from "@/components/ui/skeletons";
import { Toaster } from "@/components/ui/toast";
import { UploadDialogRenderer } from "@/components/upload/upload-dialog-renderer";
import { cn } from "@/lib/shared";
import { ourFileRouter } from "./api/uploadthing/core";
import { fontHeading, fontMono, fontSans } from "./fonts";

const DesktopSidebar = dynamic(() =>
	import("@/components/navigation/desktop-sidebar").then((m) => ({
		default: m.DesktopSidebar,
	})),
);
const TopNav = dynamic(() =>
	import("@/components/navigation/top-nav").then((m) => ({
		default: m.TopNav,
	})),
);
const BottomNav = dynamic(() =>
	import("@/components/navigation/bottom-nav").then((m) => ({
		default: m.BottomNav,
	})),
);
const FloatingToolsButton = dynamic(() =>
	import("@/components/tools/floating-tools-button").then((m) => ({
		default: m.FloatingToolsButton,
	})),
);

async function UTSSR() {
	await connection();
	return <NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />;
}

const jsonLd = {
	"@context": "https://schema.org",
	"@type": "WebApplication",
	name: "Lumni",
	url: "https://lumni.ai",
	description:
		"Pass your Matric with confidence — AI-powered quizzes, past papers, and a personalized study planner for South African students.",
	applicationCategory: "EducationalApplication",
	operatingSystem: "Web",
	offers: {
		"@type": "Offer",
		price: "0",
		priceCurrency: "ZAR",
	},
	author: {
		"@type": "Organization",
		name: "Lumni",
		url: "https://lumni.ai",
	},
};

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
		url: "https://lumni.ai",
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
			<body className="flex h-full min-h-full flex-col bg-[--system-background] text-[--system-text-primary] antialiased">
				<a
					href="#main-content"
					className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-skip-link focus:rounded-lg focus:bg-background focus:px-4 focus:py-2 focus:text-foreground focus:shadow-lg focus:outline-2 focus:outline-system-accent focus:outline-offset-2"
				>
					Skip to content
				</a>
				<Script
					id="theme-init"
					strategy="beforeInteractive"
					// biome-ignore lint/security/noDangerouslySetInnerHtml: theme FOUC prevention
					dangerouslySetInnerHTML={{
						__html: `(function(){try{var t=localStorage.getItem("theme");if(t==="dark"){document.documentElement.classList.add("dark");document.documentElement.style.colorScheme="dark"}else if(t==="light"){document.documentElement.classList.remove("dark");document.documentElement.style.colorScheme="light"}else{if(window.matchMedia("(prefers-color-scheme:dark)").matches){document.documentElement.classList.add("dark");document.documentElement.style.colorScheme="dark"}else{document.documentElement.classList.remove("dark");document.documentElement.style.colorScheme="light"}}}catch(e){}})()`,
					}}
				/>
				<Suspense fallback={<CardSkeleton />}>
					<UTSSR />
				</Suspense>
				<Script
					id="json-ld"
					type="application/ld+json"
					strategy="afterInteractive"
					// biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data (static, no user input)
					dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
				/>
				<Providers>
					<LazyMotion features={domAnimation}>
						<UploadDialogRenderer />
						<Toaster />
						<FloatingToolsButton />
						<div className="flex flex-1">
							<DesktopSidebar />
							<main id="main-content" className="flex min-w-0 flex-1 flex-col">
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
