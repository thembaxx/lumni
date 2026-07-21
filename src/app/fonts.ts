import localFont from "next/font/local";

export const fontSans = localFont({
  src: "../fonts/open-runde-latin-400-normal.woff2",
  weight: "400",
  style: "normal",
  display: "swap",
  variable: "--font-sans",
  preload: true,
  adjustFontFallback: "Arial",
});

export const fontMono = localFont({
  src: "../fonts/geist-mono-latin.woff2",
  weight: "400",
  style: "normal",
  display: "swap",
  variable: "--font-geist-mono",
  preload: true,
  adjustFontFallback: "Arial",
});

export const fontHeading = localFont({
  src: [
    { path: "../fonts/open-runde-latin-400-normal.woff2", weight: "400" },
    { path: "../fonts/open-runde-latin-500-normal.woff2", weight: "500" },
    { path: "../fonts/open-runde-latin-600-normal.woff2", weight: "600" },
    { path: "../fonts/open-runde-latin-700-normal.woff2", weight: "700" },
  ],
  display: "swap",
  variable: "--font-heading",
  preload: true,
  adjustFontFallback: "Arial",
});
