import { Geist, Geist_Mono, Outfit } from "next/font/google";

export const fontSans = Geist({
	weight: ["400", "500", "600", "800"],
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

export const fontHeading = Outfit({
	weight: ["400", "500", "600", "700", "800", "900"],
	subsets: ["latin"],
	display: "swap",
	variable: "--font-heading",
	preload: true,
});
