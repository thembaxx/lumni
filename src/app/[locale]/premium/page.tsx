import type { Metadata } from "next";
import { PremiumClient } from "./premium-client";

export const metadata: Metadata = {
	title: "Premium - Lumni",
	description: "All Lumni features are free",
};

export default function PremiumPage() {
	return <PremiumClient />;
}
