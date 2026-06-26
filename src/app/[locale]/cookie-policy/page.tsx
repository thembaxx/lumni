import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import { getTranslations } from "next-intl/server";
import { PageContainer } from "@/components/layout/page-container";

export const metadata: Metadata = {
  title: "Cookie Policy - Lumni",
  description: "How Lumni uses cookies and similar technologies",
};

export default async function CookiePolicyPage() {
  "use cache";
  cacheLife("stable");
  const t = await getTranslations();
  return (
    <div className="min-h-dvh bg-system-grouped py-8">
      <PageContainer className="flex flex-col gap-6">
        <h1 className="ios-title-1 font-semibold text-foreground tracking-tight">
          {t("consent.cookiePolicy.heading")}
        </h1>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <p className="text-muted-foreground">{t("consent.cookiePolicy.lastUpdated")}</p>
          <section className="flex flex-col gap-4">
            <h2 className="font-semibold text-lg">1. What Are Cookies</h2>
            <p className="text-muted-foreground">
              Cookies are small text files stored on your device when you visit a website. They help
              the site function, improve performance, and provide analytics.
            </p>

            <h2 className="font-semibold text-lg">2. Cookies We Use</h2>

            <h3 className="font-medium">Essential Cookies</h3>
            <p className="text-muted-foreground">
              Required for the app to function. Includes session cookies for authentication
              (Appwrite session) and locale preferences. No consent required.
            </p>

            <h3 className="font-medium">Analytics Cookies</h3>
            <p className="text-muted-foreground">
              Used to understand how users interact with Lumni. We use Sentry for error tracking.
              Enabled only with your consent.
            </p>

            <h2 className="font-semibold text-lg">3. Managing Cookies</h2>
            <p className="text-muted-foreground">
              You can manage your cookie preferences at any time from your Privacy Settings.
              Essential cookies cannot be disabled.
            </p>

            <h2 className="font-semibold text-lg">4. Contact</h2>
            <p className="text-muted-foreground">
              For questions about our cookie usage, contact us at{" "}
              <a href="mailto:support@lumni.ai" className="text-system-accent underline">
                support@lumni.ai
              </a>
              .
            </p>
          </section>
        </div>
      </PageContainer>
    </div>
  );
}
