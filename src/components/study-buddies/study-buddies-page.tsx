"use client";

import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { useStudyBuddies } from "@/hooks/use-study-buddies";
import { CommitmentCard } from "@/components/study-buddies/commitment-card";
import { BuddyFinder } from "@/components/study-buddies/buddy-finder";

export function StudyBuddiesPage() {
  const { commitments, loading, fetchCommitments, createCommitment, acceptCommitment, declineCommitment, completeCommitment } = useStudyBuddies();

  useEffect(() => {
    fetchCommitments();
  }, [fetchCommitments]);

  const pending = commitments.filter((c) => c.status === "pending");
  const active = commitments.filter((c) => c.status === "active");
  const history = commitments.filter((c) => c.status === "completed" || c.status === "declined");

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 py-6">
      <div>
        <h1 className="text-2xl font-extrabold">Study Buddies</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Study with friends and stay accountable
        </p>
      </div>

      <BuddyFinder onCommit={createCommitment} />

      {loading && <p className="text-sm text-muted-foreground">Loading commitments...</p>}

      {pending.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Pending ({pending.length})</h2>
          <div className="flex flex-col gap-2" role="list">
            {pending.map((c) => (
              <CommitmentCard key={c.id} commitment={c} onAccept={acceptCommitment} onDecline={declineCommitment} />
            ))}
          </div>
        </section>
      )}

      {active.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Active ({active.length})</h2>
          <div className="flex flex-col gap-2" role="list">
            {active.map((c) => (
              <CommitmentCard key={c.id} commitment={c} onComplete={completeCommitment} />
            ))}
          </div>
        </section>
      )}

      {history.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">History ({history.length})</h2>
          <div className="flex flex-col gap-2" role="list">
            {history.map((c) => (
              <CommitmentCard key={c.id} commitment={c} />
            ))}
          </div>
        </section>
      )}

      {!loading && commitments.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No study commitments yet. Find a buddy above to get started!</p>
        </Card>
      )}
    </div>
  );
}
