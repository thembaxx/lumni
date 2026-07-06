"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SchoolOnboardingWizard } from "@/components/school/school-onboarding-wizard";
import { useSchool } from "@/hooks/use-school";

export function SchoolClient() {
  const [schoolId, setSchoolId] = useState<string | null>(null);

  const {
    data: billing,
    isLoading,
    error,
  } = useSchool({ schoolId: schoolId ?? "" }, { enabled: !!schoolId });

  if (!schoolId && !billing) {
    return <SchoolOnboardingWizard onComplete={(id) => setSchoolId(id)} />;
  }

  if (isLoading) {
    return <div className="py-12 text-center text-muted-foreground">Loading school info...</div>;
  }

  if (error || !billing) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <p className="text-destructive">Failed to load school information.</p>
        <Button variant="outline" onClick={() => setSchoolId(null)}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 py-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">{billing.school.name}</h1>
        <p className="text-muted-foreground">Manage your school account and billing.</p>
      </div>

      <Card className="flex flex-col gap-4 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <span className="text-sm text-muted-foreground">Plan</span>
            <span className="font-semibold capitalize">{billing.school.licenseTier}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm text-muted-foreground">Status</span>
            <span className="font-semibold capitalize">{billing.school.billingStatus}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm text-muted-foreground">Seats</span>
            <span className="font-semibold">
              {billing.school.seatsUsed} / {billing.school.seatCount} used
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm text-muted-foreground">Subscription</span>
            <span className="font-semibold">{billing.currentLicense ? "Active" : "None"}</span>
          </div>
        </div>
      </Card>

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => window.open("https://billing.stripe.com", "_blank")}
        >
          Manage Billing
        </Button>
      </div>
    </div>
  );
}
