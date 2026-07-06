import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { LicenseTier, PRICING } from "@/lib/school/pricing";

interface TierCardProps {
  tierId: LicenseTier;
  tier: (typeof PRICING)[LicenseTier];
  isCurrentPlan: boolean;
  onSelect: (tierId: LicenseTier) => void;
}

export function TierCard({ tierId, tier, isCurrentPlan, onSelect }: TierCardProps) {
  const price =
    tier.monthlyPrice === 0 ? "Free" : `R ${(tier.monthlyPrice / 100).toLocaleString()}/mo`;

  return (
    <Card className="flex flex-col gap-4 p-6">
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-semibold">{tier.label}</h3>
        <p className="text-2xl font-bold">{price}</p>
      </div>
      <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
        <li>{tier.teacherSeatsIncluded} teacher seats included</li>
        <li>{tier.aiQuestionsPerDay.toLocaleString()} AI questions/day</li>
        <li>
          {tier.ghostLinks === -1 ? "Unlimited ghost links" : `${tier.ghostLinks} ghost links`}
        </li>
        {tier.extraSeatPrice > 0 && (
          <li>Extra seats: R {(tier.extraSeatPrice / 100).toLocaleString()}/mo each</li>
        )}
      </ul>
      <Button
        variant={isCurrentPlan ? "outline" : "default"}
        onClick={() => onSelect(tierId)}
        disabled={isCurrentPlan}
      >
        {isCurrentPlan ? "Current Plan" : "Select"}
      </Button>
    </Card>
  );
}
