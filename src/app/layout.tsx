import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { cn } from "@/lib/utils";
import "./globals.css";
import { geistMono, publicSans, sora } from "./fonts";

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
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0e0e0c" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const nonce = (await headers()).get("x-csp-nonce") ?? undefined;

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("h-full antialiased", sora.variable, publicSans.variable, geistMono.variable)}
      style={{ colorScheme: "light dark" }}
    >
      <head>
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var c=document.cookie.match(/(?:^|;\\s*)theme=([^;]*)/),d=c?c[1]==="dark":matchMedia("(prefers-color-scheme:dark)").matches;d&&document.documentElement.classList.add("dark");document.documentElement.style.colorScheme=d?"dark":"light"}catch(e){}})();`,
          }}
        />
        <link rel="preconnect" href="https://fra.cloud.appwrite.io" />
        <link rel="preconnect" href="https://utfs.io" />
        <link rel="preconnect" href="https://api.iconify.design" />
        <link rel="preconnect" href="https://upload.wikimedia.org" />
        <link rel="prefetch" href="/en/dashboard" as="document" />
      </head>
      <body className="flex h-full min-h-full flex-col bg-background text-foreground antialiased font-body">
        {children}
      </body>
    </html>
  );
}
