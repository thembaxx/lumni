import { Geist, Geist_Mono } from "next/font/google";

export const fontSans = Geist({
	weight: ["400", "500", "600", "700"],
	subsets: ["latin"],
	display: "swap",
	variable: "--font-sans",
	preload: true,
});

export const fontMono = Geist_Mono({
	weight: ["400", "500", "700"],
	subsets: ["latin"],
	display: "swap",
	variable: "--font-geist-mono",
	preload: true,
});
