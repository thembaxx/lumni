import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { domAnimation, LazyMotion } from "framer-motion";
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import Script from "next/script";
import { connection } from "next/server";
import {
	getMessages,
	getTranslations,
	setRequestLocale,
} from "next-intl/server";
import { Suspense } from "react";
import { extractRouterConfig } from "uploadthing/server";
import { SidebarStateProvider } from "@/components/navigation/sidebar-nav";
import { ChunkLoadHandler } from "@/components/performance/chunk-load-handler";
import { Providers } from "@/components/providers";
import { AppErrorBoundary } from "@/components/shared/app-error-boundary";
import { CardSkeleton } from "@/components/ui/skeletons";
import { Toaster } from "@/components/ui/toast";
import { UploadDialogRenderer } from "@/components/upload/upload-dialog-renderer";
import { isValidLocale, locales } from "@/i18n/locales";
import { timeZone } from "@/i18n/request";
import { ourFileRouter } from "../api/uploadthing/core";

const SidebarNav = dynamic(() =>
	import("@/components/navigation/sidebar-nav").then((m) => ({
		default: m.SidebarNav,
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
const CookieBanner = dynamic(() =>
	import("@/components/consent/cookie-banner").then((m) => ({
		default: m.CookieBanner,
	})),
);
const TosBanner = dynamic(() =>
	import("@/components/consent/tos-banner").then((m) => ({
		default: m.TosBanner,
	})),
);

async function Utssr() {
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

export default async function LocaleLayout({
	children,
	params,
}: Readonly<{
	children: React.ReactNode;
	params: Promise<{ locale: string }>;
}>) {
	const { locale } = await params;

	if (!isValidLocale(locale)) {
		notFound();
	}

	setRequestLocale(locale);

	const [messages, t] = await Promise.all([
		getMessages(),
		getTranslations({ locale, namespace: "common" }),
	]);

	return (
		<>
			<a
				href="#main-content"
				className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-skip-link focus:rounded-lg focus:bg-background focus:px-4 focus:py-2 focus:text-foreground focus:shadow-lg focus:outline-2 focus:outline-system-accent focus:outline-offset-2"
			>
				{t("skipToContent")}
			</a>
			<Suspense fallback={<CardSkeleton />}>
				<Utssr />
			</Suspense>
			<Script
				id="json-ld"
				type="application/ld+json"
				strategy="afterInteractive"
				// react-doctor will-fix: JSON-LD structured data is static, no user input
				// biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data (static, no user input)
				dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
			/>
			<ChunkLoadHandler />
			<Providers locale={locale} messages={messages} timeZone={timeZone}>
				<LazyMotion features={domAnimation}>
					<UploadDialogRenderer />
					<Toaster />
					<CookieBanner />
					<TosBanner />
					<SidebarStateProvider>
						<div className="flex flex-1">
							<SidebarNav />
							<main
								id="main-content"
								className="flex min-w-0 flex-1 flex-col pb-[calc(64px+env(safe-area-inset-bottom,0px))]"
							>
								<TopNav />
								<AppErrorBoundary>{children}</AppErrorBoundary>
							</main>
						</div>
						<BottomNav />
					</SidebarStateProvider>
				</LazyMotion>
			</Providers>
		</>
	);
}
