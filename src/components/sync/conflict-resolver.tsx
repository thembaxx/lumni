"use client";

import { useState, useEffect } from "react";
import { dexieDataAccess } from "@/lib/db";
import { getPendingOutboxEntries, removeOutboxEntries, incrementRetry } from "@/lib/sync/outbox";
import { logError } from "@/lib/shared/logger";
import { Button } from "@/components/ui/button";

interface StuckEntry {
  id: number;
  table: string;
  recordId: string;
  operation: string;
  retries: number;
}

export function ConflictResolver() {
  const [entries, setEntries] = useState<StuckEntry[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    getPendingOutboxEntries(dexieDataAccess, 100)
      .then((all) => {
        setEntries(
          all
            .filter((e) => e.retries >= 3)
            .map((e) => ({
              id: e.id!,
              table: e.table,
              recordId: e.recordId,
              operation: e.operation,
              retries: e.retries,
            })),
        );
      })
      .catch((e) => {
        logError("ConflictResolver.loadConflicts", e);
      });
  }, [open]);

  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-destructive">
          Sync conflicts ({entries.length})
        </h3>
        <Button variant="outline" size="sm" onClick={() => setOpen(!open)}>
          {open ? "Hide" : "Review"}
        </Button>
      </div>
      {open && entries.length > 0 && (
        <ul className="flex flex-col gap-2">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="flex items-center justify-between rounded bg-secondary p-2 text-xs"
            >
              <span className="truncate">
                <strong>{entry.table}</strong> / {entry.recordId} &mdash; {entry.operation} (&times;
                {entry.retries})
              </span>
              <div className="flex gap-1">
                <Button
                  variant="default"
                  size="sm"
                  onClick={async () => {
                    await incrementRetry(dexieDataAccess, entry.id);
                    fetch("/api/sync/push", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        table: entry.table,
                        recordId: entry.recordId,
                        operation: entry.operation,
                      }),
                    });
                    setEntries((prev) => prev.filter((e) => e.id !== entry.id));
                  }}
                >
                  Retry
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={async () => {
                    await removeOutboxEntries(dexieDataAccess, [entry.id]);
                    setEntries((prev) => prev.filter((e) => e.id !== entry.id));
                  }}
                >
                  Discard
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
