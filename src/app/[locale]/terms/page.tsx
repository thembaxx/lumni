import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/page-container";

export const metadata: Metadata = {
  title: "Terms of Service - Lumni",
  description: "Terms and conditions for using Lumni study tools",
};

export default async function TermsPage() {
  return (
    <div className="min-h-dvh bg-system-grouped py-8">
      <PageContainer className="flex flex-col gap-6">
        <h1 className="ios-title-1 font-semibold text-foreground tracking-tight">
          Terms of Service
        </h1>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <p className="text-muted-foreground">Last updated: May 2026</p>
          <section className="flex flex-col gap-4">
            <h2 className="font-semibold text-lg">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground">
              By using Lumni, you agree to these terms. If you do not agree, please do not use the
              service.
            </p>

            <h2 className="font-semibold text-lg">2. Account</h2>
            <p className="text-muted-foreground">
              You are responsible for maintaining your account credentials and for all activity
              under your account. Users under 18 require parental consent.
            </p>

            <h2 className="font-semibold text-lg">3. Limitation of Liability</h2>
            <p className="text-muted-foreground">
              Lumni provides study tools and practice materials. We do not guarantee exam results.
              The service is provided &ldquo;as is&rdquo; without warranty of any kind.
            </p>

            <h2 className="font-semibold text-lg">5. Contact</h2>
            <p className="text-muted-foreground">
              For questions about these terms, contact us at support@lumni.ai.
            </p>
          </section>
        </div>
      </PageContainer>
    </div>
  );
}
