import { Inter, JetBrains_Mono } from "next/font/google";

export const fontSans = Inter({
	weight: ["400", "500", "600", "700", "800"],
	subsets: ["latin"],
	display: "swap",
	variable: "--font-geist",
	preload: true,
});
export const fontMono = JetBrains_Mono({
	weight: ["400", "500", "600", "700", "800"],
	subsets: ["latin"],
	display: "swap",
	variable: "--font-geist-mono",
	preload: true,
});
