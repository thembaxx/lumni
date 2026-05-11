import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import type { Metadata, Viewport } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { extractRouterConfig } from "uploadthing/server";

import "./globals.css";
import { PageTransition } from "@/components/layout/page-transition";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { Providers } from "@/components/providers";
import { FloatingToolsButton } from "@/components/tools";
import { UploadDialogRenderer } from "@/components/upload/upload-dialog-renderer";
import { ourFileRouter } from "./api/uploadthing/core";
import { fontMono, fontSans } from "./fonts";

async function UTSSR() {
	await connection();
	return <NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />;
}

export const metadata: Metadata = {
	title: {
		default: "Lumni",
		template: "%s | Lumni",
	},
	description: "Your AI assistant",
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
		description: "Your AI assistant",
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
		description: "Your AI assistant",
		images: ["/og-image.png"],
	},
};

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	maximumScale: 5,
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang="en"
			className={`${fontSans.variable} ${fontMono.variable} h-full antialiased`}
		>
			<body
				className={`${fontSans.variable} ${fontMono.variable} h-full antialiased min-h-full flex flex-col bg-[--system-background] text-[--system-text-primary]`}
			>
				<Suspense fallback={null}>
					<UTSSR />
				</Suspense>
				<Providers>
					<UploadDialogRenderer />
					<FloatingToolsButton />
					<PageTransition>
						{children}
						<BottomNav />
					</PageTransition>
				</Providers>
			</body>
		</html>
	);
}
