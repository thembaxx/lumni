import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Premium - Lumni",
	description: "Upgrade to Lumni Premium for advanced features",
};

export default function PremiumLayout({
	children,
}: { children: React.ReactNode }) {
	return children;
}
