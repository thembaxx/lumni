"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiFetch } from "@/lib/shared/api-fetch";
import { logError } from "@/lib/shared/logger";

interface SchoolInfo {
  id: string;
  name: string;
  licenseTier: string;
  billingStatus: string;
  seatCount: number;
  seatsUsed: number;
  trialEndsAt: string | null;
}

interface LicenseInfo {
  $id: string;
  tier: string;
  status: string;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  seatCount: number;
  totalPrice: number;
}

interface Invoice {
  $id: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  description: string;
}

interface BillingResponse {
  school: SchoolInfo | null;
  currentLicense: LicenseInfo | null;
  invoices: Invoice[];
  totalPages: number;
}

export function SchoolBillingClient() {
  const [data, setData] = useState<BillingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const fetchBilling = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiFetch<BillingResponse>("/api/school/billing?schoolId=school", {
        method: "GET",
      });
      setData(result);
    } catch (err) {
      logError("SchoolBillingClient.fetchBilling", err);
      setError("Failed to load billing data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBilling();
  }, [fetchBilling]);

  const handleCancel = async () => {
    if (!data?.school?.id) return;
    if (!window.confirm("Are you sure you want to cancel your subscription?")) return;

    try {
      setCancelling(true);
      await apiFetch("/api/school/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolId: data.school.id, immediate: false }),
      });
      await fetchBilling();
    } catch (err) {
      logError("SchoolBillingClient.handleCancel", err);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading billing data...</div>;
  }

  if (error) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" onClick={fetchBilling}>
          Retry
        </Button>
      </div>
    );
  }

  if (!data?.school) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">No school found.</p>
        <Button asChild>
          <Link href="/school/onboarding">Set Up Your School</Link>
        </Button>
      </div>
    );
  }

  const license = data.currentLicense;
  const tierLabel =
    data.school.licenseTier === "free"
      ? "Free"
      : data.school.licenseTier === "standard"
        ? "Standard"
        : data.school.licenseTier === "premium"
          ? "Premium"
          : data.school.licenseTier;

  const statusLabel =
    data.school.billingStatus === "active"
      ? "Active"
      : data.school.billingStatus === "cancelling"
        ? "Cancelling"
        : data.school.billingStatus === "cancelled"
          ? "Cancelled"
          : data.school.billingStatus === "past_due"
            ? "Past Due"
            : data.school.billingStatus;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="flex flex-col gap-4 p-6">
          <h2 className="text-lg font-semibold">Current Plan</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">Plan</span>
              <span className="font-medium">{tierLabel}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">Status</span>
              <span className="font-medium">{statusLabel}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">Seats</span>
              <span className="font-medium">
                {data.school.seatsUsed} of {data.school.seatCount}
              </span>
            </div>
            {license && (
              <div className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground">License expires</span>
                <span className="font-medium">
                  {new Date(license.endDate).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          {license && license.totalPrice > 0 && (
            <div className="flex flex-col gap-1 pt-2">
              <span className="text-sm text-muted-foreground">Current total</span>
              <span className="text-lg font-bold">
                R {(license.totalPrice / 100).toLocaleString()}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button asChild variant="outline">
          <Link href="/school/onboarding">Change Plan</Link>
        </Button>
        {data.school.billingStatus === "active" && (
          <Button variant="destructive" onClick={handleCancel} disabled={cancelling}>
            {cancelling ? "Cancelling..." : "Cancel Subscription"}
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 p-6">
          <h2 className="text-lg font-semibold">Invoice History</h2>
          {data.invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground">No invoices yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium">Description</th>
                    <th className="pb-2 font-medium">Amount</th>
                    <th className="pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.invoices.map((inv) => (
                    <tr key={inv.$id} className="border-b last:border-0">
                      <td className="py-2">{new Date(inv.createdAt).toLocaleDateString()}</td>
                      <td className="py-2">{inv.description}</td>
                      <td className="py-2">R {(inv.amount / 100).toLocaleString()}</td>
                      <td className="py-2 capitalize">{inv.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
