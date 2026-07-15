"use client";

import { Card } from "@/components/ui/card";
import { CommitmentCard } from "@/components/study-buddies/commitment-card";
import type { Commitment } from "@/hooks/use-study-buddies";

interface CommitmentListProps {
  commitments: Commitment[];
  loading: boolean;
  onAccept?: (id: number) => void;
  onDecline?: (id: number) => void;
  onComplete?: (id: number) => void;
}

export function CommitmentList({
  commitments,
  loading,
  onAccept,
  onDecline,
  onComplete,
}: CommitmentListProps) {
  const pending = commitments.filter((c) => c.status === "pending");
  const active = commitments.filter((c) => c.status === "active");
  const completed = commitments.filter((c) => c.status === "completed" || c.status === "declined");

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading commitments...</p>;
  }

  if (commitments.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">
          No study commitments yet. Find a buddy above to get started!
        </p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {pending.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Pending ({pending.length})</h2>
          <div className="flex flex-col gap-2" role="list">
            {pending.map((c) => (
              <CommitmentCard key={c.id} commitment={c} onAccept={onAccept} onDecline={onDecline} />
            ))}
          </div>
        </section>
      )}

      {active.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Active ({active.length})</h2>
          <div className="flex flex-col gap-2" role="list">
            {active.map((c) => (
              <CommitmentCard key={c.id} commitment={c} onComplete={onComplete} />
            ))}
          </div>
        </section>
      )}

      {completed.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">History ({completed.length})</h2>
          <div className="flex flex-col gap-2" role="list">
            {completed.map((c) => (
              <CommitmentCard key={c.id} commitment={c} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
