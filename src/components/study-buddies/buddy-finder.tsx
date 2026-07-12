"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface BuddyFinderProps {
  onCommit: (buddyUserId: string, subject: string, targetDailyMinutes?: number) => Promise<boolean>;
}

export function BuddyFinder({ onCommit }: BuddyFinderProps) {
  const [buddyId, setBuddyId] = useState("");
  const [subject, setSubject] = useState("");
  const [minutes, setMinutes] = useState(30);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buddyId || !subject) return;
    setLoading(true);
    await onCommit(buddyId, subject, minutes);
    setBuddyId("");
    setSubject("");
    setMinutes(30);
    setLoading(false);
  };

  return (
    <Card className="p-4">
      <h2 className="mb-3 text-lg font-semibold">Create Study Commitment</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <label htmlFor="buddy-id" className="mb-1 block text-sm font-medium">Buddy User ID or Email</label>
          <input
            id="buddy-id"
            value={buddyId}
            onChange={(e) => setBuddyId(e.target.value)}
            placeholder="Enter your buddy's user ID"
            className="w-full rounded-lg border bg-background p-2 text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="buddy-subject" className="mb-1 block text-sm font-medium">Subject</label>
          <input
            id="buddy-subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Mathematics"
            className="w-full rounded-lg border bg-background p-2 text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="buddy-minutes" className="mb-1 block text-sm font-medium">Daily target (minutes)</label>
          <input
            id="buddy-minutes"
            type="number"
            min={5}
            max={480}
            value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value))}
            className="w-full rounded-lg border bg-background p-2 text-sm"
          />
        </div>
        <Button type="submit" disabled={loading || !buddyId || !subject}>
          {loading ? "Creating..." : "Create Commitment"}
        </Button>
      </form>
    </Card>
  );
}
