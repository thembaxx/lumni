"use client";

import * as m from "motion/react-m";
import { AmbientGradient } from "@/components/shared/ambient-gradient";
import { PageContainer } from "@/components/layout/page-container";
import { motionEase } from "@/lib/utils/animation";
import { ReferralTab } from "@/components/settings/tabs/referral-tab";

export function ReferralPageClient() {
  return (
    <div className="min-h-dvh bg-system-grouped pt-4">
      <AmbientGradient />
      <PageContainer className="flex flex-col gap-6">
        <m.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: motionEase }}
        >
          <h1 className="ios-title-1 font-extrabold text-foreground tracking-tight">Referral</h1>
        </m.div>
        <ReferralTab />
      </PageContainer>
    </div>
  );
}
