"use client";

import { useEffect } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { useStudyBuddies } from "@/hooks/use-study-buddies";
import { BuddyFinder } from "@/components/study-buddies/buddy-finder";
import { CommitmentList } from "@/components/study-buddies/commitment-list";

export function StudyBuddiesPage() {
  const {
    commitments,
    loading,
    fetchCommitments,
    createCommitment,
    acceptCommitment,
    declineCommitment,
    completeCommitment,
  } = useStudyBuddies();

  useEffect(() => {
    fetchCommitments();
  }, [fetchCommitments]);

  return (
    <PageContainer>
      <div className="flex flex-col gap-6 py-6">
        <div>
          <h1 className="text-2xl font-extrabold">Study Buddies</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Study with friends and stay accountable
          </p>
        </div>

        <BuddyFinder onCommit={createCommitment} />

        <CommitmentList
          commitments={commitments}
          loading={loading}
          onAccept={acceptCommitment}
          onDecline={declineCommitment}
          onComplete={completeCommitment}
        />
      </div>
    </PageContainer>
  );
}
