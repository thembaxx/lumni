import type { Metadata } from "next";
import { PremiumClient } from "./premium-client";

export const metadata: Metadata = {
	title: "Premium - Lumni",
	description:
		"Upgrade to Lumni Premium for advanced features and priority support",
};

export default function PremiumPage() {
	return <PremiumClient />;
}
