import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PageContainer } from "@/components/layout/page-container";

export const metadata: Metadata = {
	title: "Privacy Policy - Lumni",
	description: "How Lumni collects, uses, and protects your personal data",
};

export default async function PrivacyPage() {
	const t = await getTranslations();
	return (
		<div className="min-h-dvh bg-system-grouped py-8">
			<PageContainer className="flex flex-col gap-6">
				<h1 className="ios-title-1 font-semibold text-foreground tracking-tight">
					{t("settings.privacyPolicy")}
				</h1>
				<div className="prose prose-sm dark:prose-invert max-w-none">
					<p className="text-muted-foreground">Last updated: May 2026</p>
					<section className="flex flex-col gap-4">
						<h2 className="font-semibold text-lg">1. Information We Collect</h2>
						<p className="text-muted-foreground">
							We collect information you provide when creating an account,
							including your name, email address, and selected subjects. We also
							collect usage data such as quiz answers, flashcard reviews, and
							study session activity to personalise your learning experience.
						</p>

						<h2 className="font-semibold text-lg">
							2. How We Use Your Information
						</h2>
						<p className="text-muted-foreground">
							Your information is used to deliver and improve our study tools,
							track your progress, generate personalised content, and send
							relevant notifications if enabled. We do not sell your personal
							data.
						</p>

						<h2 className="font-semibold text-lg">3. Cookies</h2>
						<p className="text-muted-foreground">
							We use essential cookies for authentication and preferences, and
							analytics cookies (Sentry) with your consent. See our{" "}
							<Link
								href="/cookie-policy"
								className="text-system-accent underline"
							>
								Cookie Policy
							</Link>{" "}
							for details. You can manage preferences in Privacy Settings.
						</p>

						<h2 className="font-semibold text-lg">
							4. Data Storage & Security
						</h2>
						<p className="text-muted-foreground">
							Data is stored securely using Appwrite cloud infrastructure. We
							implement industry-standard security measures to protect your
							information.
						</p>

						<h2 className="font-semibold text-lg">5. Your Rights</h2>
						<p className="text-muted-foreground">
							You can request a copy of your data (export) or delete your
							account at any time from your Privacy Settings. You can also
							withdraw consent for analytics, marketing, and data sharing at any
							time.
						</p>

						<h2 className="font-semibold text-lg">6. Contact</h2>
						<p className="text-muted-foreground">
							For privacy-related inquiries, contact us at support@lumni.ai.
						</p>
					</section>
				</div>
			</PageContainer>
		</div>
	);
}
