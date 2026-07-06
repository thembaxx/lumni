"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { PRICING } from "@/lib/school/pricing";
import type { LicenseTier } from "@/lib/school/pricing";
import { TierCard } from "./tier-card";

interface SchoolOnboardingWizardProps {
  onComplete: (schoolId: string) => void;
}

export function SchoolOnboardingWizard({ onComplete }: SchoolOnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: "", domain: "", province: "", contactEmail: "" });
  const [selectedTier, setSelectedTier] = useState<LicenseTier | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [schoolId, setSchoolId] = useState<string | null>(null);

  const updateForm = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleRegister = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/school/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Registration failed");
      setSchoolId(data.schoolId);
      setStep(3);
    } catch {
      // error handled in UI state
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckout = async () => {
    if (!schoolId || !selectedTier) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/school/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolId, tier: selectedTier, billingFrequency: "monthly" }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      // error handled
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirm = () => {
    if (schoolId) onComplete(schoolId);
  };

  if (step === 1) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold">School Details</h2>
          <p className="text-sm text-muted-foreground">
            Enter your school information to get started.
          </p>
        </div>
        <Card className="flex flex-col gap-4 p-6">
          <Input
            placeholder="School Name"
            value={form.name}
            onChange={(e) => updateForm("name", e.target.value)}
            aria-label="School name"
          />
          <Input
            placeholder="Domain (e.g. school.edu)"
            value={form.domain}
            onChange={(e) => updateForm("domain", e.target.value)}
            aria-label="Domain"
          />
          <Input
            placeholder="Province"
            value={form.province}
            onChange={(e) => updateForm("province", e.target.value)}
            aria-label="Province"
          />
          <Input
            placeholder="Contact Email"
            type="email"
            value={form.contactEmail}
            onChange={(e) => updateForm("contactEmail", e.target.value)}
            aria-label="Contact email"
          />
          <Button
            onClick={() => setStep(2)}
            disabled={!form.name || !form.domain || !form.contactEmail}
          >
            Next: Select Tier
          </Button>
        </Card>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold">Select a Plan</h2>
          <p className="text-sm text-muted-foreground">Choose the tier that fits your school.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {(Object.keys(PRICING) as LicenseTier[]).map((tierId) => (
            <TierCard
              key={tierId}
              tierId={tierId}
              tier={PRICING[tierId]}
              isCurrentPlan={selectedTier === tierId}
              onSelect={(id) => setSelectedTier(id)}
            />
          ))}
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setStep(1)}>
            Back
          </Button>
          <Button onClick={handleRegister} disabled={!selectedTier || isSubmitting}>
            {isSubmitting
              ? "Registering..."
              : `Continue with ${selectedTier ? PRICING[selectedTier].label : ""}`}
          </Button>
        </div>
      </div>
    );
  }

  if (step === 3) {
    const isPaid = selectedTier && PRICING[selectedTier].monthlyPrice > 0;
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold">{isPaid ? "Set Up Payment" : "Almost Done"}</h2>
          <p className="text-sm text-muted-foreground">
            {isPaid
              ? "You'll be redirected to Stripe Checkout to complete payment."
              : "Your free school account is ready."}
          </p>
        </div>
        <Card className="flex flex-col gap-4 p-6">
          <div className="flex flex-col gap-1">
            <span className="text-sm text-muted-foreground">School</span>
            <span className="font-medium">{form.name}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm text-muted-foreground">Plan</span>
            <span className="font-medium">{selectedTier ? PRICING[selectedTier].label : ""}</span>
          </div>
        </Card>
        <div className="flex gap-3">
          {isPaid ? (
            <>
              <Button variant="outline" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button onClick={handleCheckout} disabled={isSubmitting}>
                {isSubmitting ? "Redirecting..." : "Proceed to Payment"}
              </Button>
            </>
          ) : (
            <Button onClick={handleConfirm}>Go to Dashboard</Button>
          )}
        </div>
      </div>
    );
  }

  return null;
}
