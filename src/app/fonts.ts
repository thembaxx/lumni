import { Geist, Geist_Mono } from "next/font/google";

export const fontSans = Geist({
	weight: ["400", "500", "600", "700", "800"],
	subsets: ["latin"],
	display: "swap",
	variable: "--font-geist",
	preload: true,
});
export const fontMono = Geist_Mono({
	weight: ["400", "500", "600", "700", "800"], // variable font range
	subsets: ["latin"],
	display: "swap",
	variable: "--font-geist-mono",
	preload: true,
});
