"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { PRICING } from "@/lib/school/pricing";
import type { LicenseTier } from "@/lib/school/pricing";
import { TierCard } from "./tier-card";
import { cn } from "@/lib/utils";
import { SeatManager } from "./seat-manager";

export function SchoolOnboardingWizard() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "",
    domain: "",
    contactEmail: "",
    contactPhone: "",
    address: "",
    agreeToTerms: false,
  });
  const [selectedTier, setSelectedTier] = useState<LicenseTier>("free");
  const [billingFrequency, setBillingFrequency] = useState<"monthly" | "annual">("monthly");
  const [isLoading, setIsLoading] = useState(false);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState<string | null>(null);
  const [registrationData, setRegistrationData] = useState<Record<string, unknown> | null>(null);

  const handleRegister = async () => {
    setIsLoading(true);
    await fetch("/api/school/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        domain: form.domain || undefined,
        contactEmail: form.contactEmail,
        contactPhone: form.contactPhone || undefined,
        address: form.address || undefined,
        agreeToTerms: true,
      }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          toast({ type: "error", message: data.error ?? "Registration failed" });
          return;
        }
        setSchoolId(data.schoolId);
        setJoinCode(data.joinCode);
        setRegistrationData(data);
        if (selectedTier === "free") {
          setStep(4);
        } else {
          setStep(3);
        }
      })
      .catch(() => {
        toast({ type: "error", message: "Network error. Please try again." });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleCheckout = () => {
    if (!schoolId || !selectedTier || selectedTier === "free") return;
    setIsLoading(true);
    fetch("/api/school/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        schoolId,
        tier: selectedTier,
        billingFrequency,
        seatCount: PRICING[selectedTier].teacherSeatsIncluded,
        returnUrl:
          typeof window !== "undefined"
            ? `${window.location.origin}/school/onboarding?success=true`
            : "",
      }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          toast({ type: "error", message: data.error ?? "Checkout failed" });
          return;
        }
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
        } else {
          toast({ type: "warning", message: data.message ?? "Payment provider not configured" });
          setStep(4);
        }
      })
      .catch(() => {
        toast({ type: "error", message: "Network error. Please try again." });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={cn(
                "flex size-8 items-center justify-center rounded-full text-sm font-medium",
                s === step
                  ? "bg-(--system-accent) text-(--system-accent-foreground)"
                  : s < step
                    ? "bg-(--system-accent)/20 text-(--system-accent)"
                    : "bg-muted text-muted-foreground",
              )}
            >
              {s < step ? "✓" : s}
            </div>
            {s < 4 && (
              <div
                className={cn("h-0.5 w-8 sm:w-12", s < step ? "bg-(--system-accent)" : "bg-muted")}
              />
            )}
          </div>
        ))}
      </div>

      <p className="text-center text-sm text-muted-foreground">Step {step} of 4</p>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-6"
          >
            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-semibold">School Information</h2>
              <p className="text-sm text-muted-foreground">
                Enter your school details to create your account.
              </p>
            </div>
            <Card>
              <CardContent className="flex flex-col gap-4 p-6">
                <Input
                  placeholder="School name *"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  aria-label="School name"
                />
                <Input
                  placeholder="Domain (e.g. school.edu)"
                  value={form.domain}
                  onChange={(e) => setForm((prev) => ({ ...prev, domain: e.target.value }))}
                  aria-label="Domain"
                />
                <Input
                  placeholder="Contact email *"
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) => setForm((prev) => ({ ...prev, contactEmail: e.target.value }))}
                  aria-label="Contact email"
                />
                <Input
                  placeholder="Contact phone"
                  type="tel"
                  value={form.contactPhone}
                  onChange={(e) => setForm((prev) => ({ ...prev, contactPhone: e.target.value }))}
                  aria-label="Contact phone"
                />
                <Input
                  placeholder="Address"
                  value={form.address}
                  onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                  aria-label="Address"
                />
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.agreeToTerms}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, agreeToTerms: e.target.checked }))
                    }
                    className="size-4 rounded border-muted-foreground"
                  />
                  <span className="text-muted-foreground">I agree to the Terms of Service</span>
                </label>
                <Button
                  onClick={() => setStep(2)}
                  disabled={!form.name || !form.contactEmail || !form.agreeToTerms}
                >
                  Next: Choose Plan
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-6"
          >
            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-semibold">Choose Your Plan</h2>
              <p className="text-sm text-muted-foreground">
                Select the plan that fits your school's needs. You can change later.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-sm text-muted-foreground">Billing:</span>
              <Button
                variant={billingFrequency === "monthly" ? "default" : "outline"}
                size="sm"
                onClick={() => setBillingFrequency("monthly")}
              >
                Monthly
              </Button>
              <Button
                variant={billingFrequency === "annual" ? "default" : "outline"}
                size="sm"
                onClick={() => setBillingFrequency("annual")}
              >
                Annual
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {(Object.keys(PRICING) as LicenseTier[]).map((tierId) => (
                <TierCard
                  key={tierId}
                  tier={tierId}
                  selected={selectedTier === tierId}
                  onSelect={() => setSelectedTier(tierId)}
                  billingFrequency={billingFrequency}
                />
              ))}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={handleRegister} disabled={isLoading}>
                {isLoading ? "Creating Account..." : `Continue with ${PRICING[selectedTier].label}`}
              </Button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-6"
          >
            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-semibold">Payment</h2>
              <p className="text-sm text-muted-foreground">
                You'll be redirected to Stripe Checkout to complete payment.
              </p>
            </div>
            <Card>
              <CardContent className="flex flex-col gap-4 p-6">
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-muted-foreground">School</span>
                  <span className="font-medium">{form.name}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-muted-foreground">Plan</span>
                  <span className="font-medium">{PRICING[selectedTier].label}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-muted-foreground">Price</span>
                  <span className="font-medium">
                    {billingFrequency === "monthly"
                      ? `R ${(PRICING[selectedTier].monthlyPrice / 100).toLocaleString()}/mo`
                      : `R ${(PRICING[selectedTier].annualPrice / 100).toLocaleString()}/yr`}
                  </span>
                </div>
              </CardContent>
            </Card>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button onClick={handleCheckout} disabled={isLoading}>
                {isLoading ? "Redirecting..." : "Proceed to Payment"}
              </Button>
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-6"
          >
            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-semibold">School Created Successfully</h2>
              <p className="text-sm text-muted-foreground">
                Your school is ready. Invite your teachers to join.
              </p>
            </div>
            {schoolId && joinCode && (
              <SeatManager
                schoolId={schoolId}
                joinCode={joinCode}
                seatCount={(registrationData?.seatCount as number) ?? 1}
                seatsUsed={(registrationData?.seatsUsed as number) ?? 1}
              />
            )}
            <Button
              onClick={() => {
                window.location.href = "/dashboard";
              }}
            >
              Go to Dashboard
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
