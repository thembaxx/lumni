"use client";

import { PageContainer } from "@/components/layout/page-container";
import { ReferralTab } from "@/components/settings/tabs/referral-tab";

export function ReferralPageClient() {
  return (
    <PageContainer>
      <div className="py-6">
        <h1 className="ios-title-1 mb-6 font-extrabold text-foreground tracking-tight">Referral</h1>
        <ReferralTab />
      </div>
    </PageContainer>
  );
}
