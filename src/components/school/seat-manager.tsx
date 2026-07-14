"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

interface SeatManagerProps {
  schoolId: string;
  joinCode: string;
  seatCount: number;
  seatsUsed: number;
}

export function SeatManager({
  schoolId: _schoolId,
  joinCode,
  seatCount,
  seatsUsed,
}: SeatManagerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(joinCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const remaining = seatCount - seatsUsed;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="flex flex-col gap-4 p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Teacher Seats</span>
            <span className="font-medium">
              {seatsUsed} of {seatCount} allocated
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-(--system-accent) transition-[width] duration-300"
              style={{ width: `${(seatsUsed / Math.max(seatCount, 1)) * 100}%` }}
            />
          </div>
          {remaining > 0 && (
            <p className="text-xs text-muted-foreground">
              {remaining} seat{remaining !== 1 ? "s" : ""} remaining
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4 p-6">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">Share Join Code</span>
            <p className="text-xs text-muted-foreground">
              Teachers can join your school using this code.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-lg bg-muted px-4 py-3 font-mono text-center text-lg font-bold tracking-widest">
              {joinCode}
            </code>
            <Button variant="outline" onClick={handleCopyCode} className="shrink-0">
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4 p-6">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">Invite Teacher</span>
            <p className="text-xs text-muted-foreground">
              Enter a teacher's email to send an invitation.
            </p>
          </div>
          <div className="flex gap-2">
            <Input placeholder="teacher@school.edu" type="email" aria-label="Teacher email" />
            <Button variant="outline" disabled>
              Invite
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Invite via email coming soon. Use the join code above for now.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
