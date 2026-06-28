import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { domAnimation, LazyMotion } from "motion/react";
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { notFound } from "next/navigation";

import { connection } from "next/server";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { extractRouterConfig } from "uploadthing/server";
import { appConfig } from "../../../app.config";
import { SidebarStateProvider } from "@/components/navigation/sidebar-nav";
import { ChunkLoadHandler } from "@/components/performance/chunk-load-handler";
import { WebVitals } from "@/components/performance/web-vitals";
import { Providers } from "@/components/providers";
import { AppErrorBoundary } from "@/components/shared/app-error-boundary";
import { NavGuard } from "@/components/navigation/nav-guard";
import { CardSkeleton } from "@/components/ui/skeletons";
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
const Toaster = dynamic(() =>
  import("@/components/ui/toast").then((m) => ({ default: m.Toaster })),
);
const UploadDialogRenderer = dynamic(() =>
  import("@/components/upload/upload-dialog-renderer").then((m) => ({
    default: m.UploadDialogRenderer,
  })),
);

async function Utssr() {
  await connection();
  return <NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />;
}

// JSON-LD is defined in home page (richer version) — no duplicate here

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

  const siteUrl = appConfig.siteUrl;

  const alternateLanguages = locales.reduce<Record<string, string>>(
    (acc, l) => {
      acc[l] = `${siteUrl}/${l}`;
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
      "Pass your Matric with confidence: AI-powered quizzes, past papers, and a personalized study planner for South African students.",
    metadataBase: new URL(siteUrl),
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      languages: alternateLanguages,
      canonical: `${siteUrl}/${locale}`,
    },
    openGraph: {
      title: "Lumni",
      description:
        "Pass your Matric with confidence: AI-powered quizzes, past papers, and a personalized study planner for South African students.",
      type: "website",
      locale: localeToOgLocale(locale),
      siteName: "Lumni",
      url: `${siteUrl}/${locale}`,
      images: [
        {
          url: "/og-image.webp",
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
        "Pass your Matric with confidence: AI-powered quizzes, past papers, and a personalized study planner for South African students.",
      images: ["/og-image.webp"],
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

  let messages: Record<string, unknown> | undefined;
  let t: (key: string) => string;
  try {
    const result = await Promise.all([
      getMessages().catch(() => ({})),
      getTranslations({ locale, namespace: "common" }).catch(() => (key: string) => key),
    ]);
    messages = result[0] as Record<string, unknown>;
    t = result[1] as (key: string) => string;
  } catch {
    messages = {};
    t = (key: string) => key;
  }

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-skip-link focus:rounded-lg focus:bg-background focus:px-4 focus:py-2 focus:text-foreground focus:shadow-lg focus:outline-2 focus:outline-system-accent focus:outline-offset-2"
      >
        {t("skipToContent")}
      </a>
      <div className="titlebar-drag-region" />
      <Suspense fallback={<CardSkeleton />}>
        <Utssr />
      </Suspense>
      <ChunkLoadHandler />
      <WebVitals />
      <Providers locale={locale} messages={messages || {}} timeZone={timeZone}>
        <LazyMotion features={domAnimation}>
          <UploadDialogRenderer />
          <Toaster />
          <NavGuard>
            <CookieBanner />
          </NavGuard>
          <NavGuard>
            <TosBanner />
          </NavGuard>
          <SidebarStateProvider>
            <div className="flex flex-1">
              <NavGuard>
                <SidebarNav />
              </NavGuard>
              <main
                id="main-content"
                className="flex min-w-0 flex-1 flex-col pb-[calc(64px+env(safe-area-inset-bottom,0px))] md:pb-0"
              >
                <NavGuard>
                  <TopNav />
                </NavGuard>
                <AppErrorBoundary>{children}</AppErrorBoundary>
              </main>
            </div>
            <NavGuard>
              <BottomNav />
            </NavGuard>
          </SidebarStateProvider>
        </LazyMotion>
      </Providers>
    </>
  );
}
