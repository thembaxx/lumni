"use client";

import { useState, useEffect, useCallback } from "react";

interface ShareItem {
  id: string;
  subject: string;
  topic: string;
  questionText: string;
  sharedAt: number;
  viewCount: number;
}

export function ShareManager() {
  const [shares, setShares] = useState<ShareItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/q/share")
      .then((res) => res.json())
      .then((data: Record<string, unknown>) => {
        if (data.error && typeof data.error === "string") {
          setError(data.error);
        } else {
          setShares((data.shares ?? []) as ShareItem[]);
        }
      })
      .catch(() => setError("Failed to load shared questions"))
      .finally(() => setLoading(false));
  }, []);

  const handleRevoke = useCallback(async (shareId: string) => {
    setRevoking(shareId);
    setError(null);
    try {
      const res = await fetch("/api/q/share", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shareId }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to revoke share");
      }
      setShares((prev) => prev.filter((s) => s.id !== shareId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to revoke share");
    } finally {
      setRevoking(null);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <span className="text-sm text-muted-foreground">Loading shared questions&hellip;</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-(--system-destructive)/20 bg-(--system-destructive)/5 px-4 py-3">
        <p className="text-sm text-(--system-destructive)">{error}</p>
      </div>
    );
  }

  if (shares.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <p className="text-sm text-muted-foreground">No shared questions</p>
        <p className="mt-1 text-xs text-muted-foreground/60">
          Questions you share will appear here
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-2 px-4 text-sm text-muted-foreground">
        You have shared {shares.length} question{shares.length !== 1 ? "s" : ""}
      </p>
      <ul className="divide-y divide-border rounded-lg border border-border">
        {shares.map((share) => (
          <li key={share.id} className="flex items-center justify-between gap-4 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{share.questionText || "(no preview)"}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {share.subject}
                {share.topic && share.topic !== "general" ? ` \u00B7 ${share.topic}` : ""}
                {" \u00B7 "}
                {formatDate(share.sharedAt)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleRevoke(share.id)}
              disabled={revoking === share.id}
              className="shrink-0 rounded-md px-3 py-1.5 text-sm font-medium text-(--system-destructive) transition-colors hover:bg-(--system-destructive)/10 disabled:opacity-50"
            >
              {revoking === share.id ? "Revoking\u2026" : "Revoke"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
