import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { domAnimation, LazyMotion } from "framer-motion";
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Script from "next/script";
import { connection } from "next/server";
import { Suspense } from "react";
import { extractRouterConfig } from "uploadthing/server";

import { locales } from "@/i18n/locales";

import ErrorBoundary from "@/components/ErrorBoundary";
import { PageTransition } from "@/components/layout/page-transition";
import { Providers } from "@/components/providers";
import { CardSkeleton } from "@/components/ui/skeletons";
import { Toaster } from "@/components/ui/toast";
import { UploadDialogRenderer } from "@/components/upload/upload-dialog-renderer";
import { ourFileRouter } from "../api/uploadthing/core";

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
	import("@/components/tools/core/floating-tools-button").then((m) => ({
		default: m.FloatingToolsButton,
	})),
);
const SnapFab = dynamic(() =>
	import("@/components/tools/core/snap-fab").then((m) => ({
		default: m.SnapFab,
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

function localeToOgLocale(locale: string): string {
	const map: Record<string, string> = {
		en: "en_ZA",
		af: "af_ZA",
		zu: "zu_ZA",
		xh: "xh_ZA",
		st: "st_ZA",
		tn: "tn_ZA",
		nso: "nso_ZA",
		ts: "ts_ZA",
		ss: "ss_ZA",
		ve: "ve_ZA",
		nd: "nd_ZA",
	};
	return map[locale] || "en_ZA";
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ locale: string }>;
}): Promise<Metadata> {
	const { locale } = await params;

	const alternateLanguages = locales.reduce<Record<string, string>>(
		(acc, l) => {
			acc[l] = `https://lumni.ai/${l}`;
			return acc;
		},
		{} as Record<string, string>,
	);

	return {
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
		alternates: {
			languages: alternateLanguages,
			canonical: `https://lumni.ai/${locale}`,
		},
		openGraph: {
			title: "Lumni",
			description:
				"Pass your Matric with confidence — AI-powered quizzes, past papers, and a personalized study planner for South African students.",
			type: "website",
			locale: localeToOgLocale(locale),
			siteName: "Lumni",
			url: `https://lumni.ai/${locale}`,
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
}

export default function LocaleLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<>
			<a
				href="#main-content"
				className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-skip-link focus:rounded-lg focus:bg-background focus:px-4 focus:py-2 focus:text-foreground focus:shadow-lg focus:outline-2 focus:outline-system-accent focus:outline-offset-2"
			>
				Skip to content
			</a>
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
					<SnapFab />
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
		</>
	);
}
