import type { Metadata, Viewport } from "next";
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fcfcfc" },
    { media: "(prefers-color-scheme: dark)", color: "#141414" },
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
      style={{ colorScheme: "light dark" }}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=document.cookie.match(/(?:^|;\\s*)theme=([^;]*)/);var d=t?t[1]==="dark":window.matchMedia("(prefers-color-scheme:dark)").matches;if(d)document.documentElement.classList.add("dark");document.documentElement.style.colorScheme=d?"dark":"light"}catch(e){}})();`,
          }}
        />
        <link rel="preconnect" href="https://fra.cloud.appwrite.io" />
        <link rel="preconnect" href="https://utfs.io" />
        <link rel="preconnect" href="https://api.iconify.design" />
        <link rel="preconnect" href="https://upload.wikimedia.org" />
        <link rel="dns-prefetch" href="https://fra.cloud.appwrite.io" />
        <link rel="dns-prefetch" href="https://utfs.io" />
        <link rel="dns-prefetch" href="https://api.iconify.design" />
        <link rel="dns-prefetch" href="https://upload.wikimedia.org" />
        <link rel="prefetch" href="/en/dashboard" as="document" />
        <script
          type="speculationrules"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              prefetch: [
                {
                  source: "list",
                  urls: ["/en/dashboard", "/en/quiz"],
                  eagerness: "moderate",
                },
              ],
            }),
          }}
        />
      </head>
      <body className="flex h-full min-h-full flex-col bg-(--system-background) text-(--system-text-primary) antialiased">
        {children}
      </body>
    </html>
  );
}
