import { Geist, Geist_Mono, Merriweather } from "next/font/google";

export const fontSans = Geist({
	weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
	subsets: ["latin"],
	display: "swap",
	variable: "--font-geist",
	preload: true,
});

export const fontMono = Geist_Mono({
	weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
	subsets: ["latin"],
	display: "swap",
	variable: "--font-geist-mono",
	preload: true,
});
export const fontSerif = Merriweather({
	weight: ["300", "400", "700", "900"],
	subsets: ["latin"],
	display: "swap",
	variable: "--font-serif",
	preload: true,
});
