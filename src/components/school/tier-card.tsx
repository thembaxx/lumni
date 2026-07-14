"use client";

import CheckmarkCircle01Icon from "@hugeicons/core-free-icons/CheckmarkCircle01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { Card } from "@/components/ui/card";
import { PRICING } from "@/lib/school/pricing";
import type { LicenseTier } from "@/lib/school/pricing";

interface TierCardProps {
  tier: LicenseTier;
  selected: boolean;
  onSelect: () => void;
  billingFrequency: "monthly" | "annual";
}

export function TierCard({ tier, selected, onSelect, billingFrequency }: TierCardProps) {
  const config = PRICING[tier];
  const price =
    config.monthlyPrice === 0
      ? "Free"
      : billingFrequency === "monthly"
        ? `R ${(config.monthlyPrice / 100).toLocaleString()}/mo`
        : `R ${(config.annualPrice / 100).toLocaleString()}/yr`;

  return (
    <Card
      className={`relative flex cursor-pointer flex-col gap-4 p-6 transition-[box-shadow,border-color] duration-150 hover:shadow-level-2 ${
        selected
          ? "border-(--system-accent) ring-2 ring-(--system-accent)"
          : "hover:border-muted-foreground/20"
      }`}
      onClick={onSelect}
    >
      {selected && (
        <div className="absolute right-3 top-3">
          <HugeiconsIcon icon={CheckmarkCircle01Icon} className="size-6 text-(--system-accent)" />
        </div>
      )}
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-semibold">{config.label}</h3>
        <p className="text-2xl font-bold">{price}</p>
        {config.monthlyPrice > 0 && billingFrequency === "annual" && (
          <p className="text-xs text-muted-foreground">
            R {(config.monthlyPrice / 100).toLocaleString()}/mo equivalent
          </p>
        )}
      </div>
      <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
        <li>{config.teacherSeatsIncluded} teacher seats included</li>
        <li>{config.aiQuestionsPerDay.toLocaleString()} AI questions/day</li>
        <li>
          {config.ghostLinks === -1 ? "Unlimited ghost links" : `${config.ghostLinks} ghost links`}
        </li>
        {config.extraSeatPrice > 0 && (
          <li>Extra seats: R {(config.extraSeatPrice / 100).toLocaleString()}/mo each</li>
        )}
      </ul>
    </Card>
  );
}
