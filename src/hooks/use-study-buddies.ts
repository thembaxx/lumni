"use client";

import { useCallback, useState } from "react";

interface Commitment {
  id: number;
  buddyUserId: string;
  buddyName: string;
  subject: string;
  status: "pending" | "active" | "completed" | "declined";
  targetDailyMinutes?: number;
  createdAt: string;
}

export function useStudyBuddies() {
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCommitments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/study-buddies/commitments");
      if (res.ok) {
        const data = await res.json();
        setCommitments(data.commitments ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const createCommitment = useCallback(
    async (buddyUserId: string, subject: string, targetDailyMinutes?: number) => {
      const res = await fetch("/api/study-buddies/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buddyUserId, subject, targetDailyMinutes }),
      });
      if (res.ok) {
        await fetchCommitments();
      }
      return res.ok;
    },
    [fetchCommitments],
  );

  const acceptCommitment = useCallback(async (id: number) => {
    const res = await fetch(`/api/study-buddies/commitments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "accept" }),
    });
    return res.ok;
  }, []);

  const declineCommitment = useCallback(async (id: number) => {
    const res = await fetch(`/api/study-buddies/commitments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "decline" }),
    });
    return res.ok;
  }, []);

  const completeCommitment = useCallback(async (id: number) => {
    const res = await fetch(`/api/study-buddies/commitments/${id}`, {
      method: "DELETE",
    });
    return res.ok;
  }, []);

  return {
    commitments,
    loading,
    fetchCommitments,
    createCommitment,
    acceptCommitment,
    declineCommitment,
    completeCommitment,
  };
}
