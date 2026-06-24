import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { getLocale } from "next-intl/server";
import { cn } from "@/lib/utils";
import "./globals.css";
import { fontHeading, fontMono, fontSans } from "./fonts";

export const metadata: Metadata = {
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export async function generateViewport(): Promise<Viewport> {
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get("theme")?.value;
  const isDark = themeCookie === "dark" || (!themeCookie && false);
  return {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    themeColor: isDark ? "oklch(10% 0.01 264)" : "oklch(100% 0 0)",
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [locale, cookieStore] = await Promise.all([getLocale(), cookies()]);
  const themeCookie = cookieStore.get("theme")?.value;
  const prefersDark = themeCookie === "dark" || (!themeCookie && false);
  const isDark = prefersDark;

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
        isDark && "dark",
      )}
      style={{ colorScheme: isDark ? "dark" : "light" }}
    >
      <head>
        <link rel="preconnect" href="https://jnb.cloud.appwrite.io" />
        <link rel="preconnect" href="https://utfs.io" />
        <link rel="preconnect" href="https://api.iconify.design" />
        <link rel="preconnect" href="https://upload.wikimedia.org" />
        <link rel="dns-prefetch" href="https://jnb.cloud.appwrite.io" />
        <link rel="dns-prefetch" href="https://utfs.io" />
        <link rel="dns-prefetch" href="https://api.iconify.design" />
        <link rel="dns-prefetch" href="https://upload.wikimedia.org" />
      </head>
      <body className="flex h-full min-h-full flex-col bg-(--system-background) text-(--system-text-primary) antialiased">
        {children}
      </body>
    </html>
  );
}
