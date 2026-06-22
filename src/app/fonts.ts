import localFont from "next/font/local";

export const fontSans = localFont({
  src: "../fonts/geist-latin.woff2",
  weight: "100 900",
  style: "normal",
  display: "swap",
  variable: "--font-sans",
  preload: true,
});

export const fontMono = localFont({
  src: "../fonts/geist-mono-latin.woff2",
  weight: "400",
  style: "normal",
  display: "swap",
  variable: "--font-geist-mono",
  preload: true,
});

export const fontHeading = localFont({
  src: "../fonts/outfit-latin.woff2",
  weight: "100 900",
  style: "normal",
  display: "swap",
  variable: "--font-heading",
  preload: true,
});
