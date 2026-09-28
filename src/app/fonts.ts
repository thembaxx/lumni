import { Geist_Mono, Public_Sans, Sora } from "next/font/google";

export const sora = Sora({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const publicSans = Public_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

// Backward compatibility exports mapping to the new design tokens
export const fontSans = publicSans;
export const fontHeading = sora;
export const fontMono = geistMono;
