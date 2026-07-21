"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Commitment {
  id: number;
  buddyUserId: string;
  buddyName: string;
  subject: string;
  status: "pending" | "active" | "completed" | "declined";
  targetDailyMinutes?: number;
  createdAt: string;
}

interface CommitmentCardProps {
  commitment: Commitment;
  onAccept?: (id: number) => void;
  onDecline?: (id: number) => void;
  onComplete?: (id: number) => void;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500",
  active: "bg-green-500",
  completed: "bg-muted-foreground/40",
  declined: "bg-destructive",
};

export function CommitmentCard({
  commitment,
  onAccept,
  onDecline,
  onComplete,
}: CommitmentCardProps) {
  return (
    <Card className="flex items-center justify-between p-4" role="listitem">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${statusColors[commitment.status] ?? "bg-muted-foreground/40"}`}
            aria-hidden="true"
          />
          <span className="font-medium">{commitment.buddyName}</span>
          <Badge variant="secondary" className="capitalize">
            {commitment.status}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Subject: {commitment.subject}
          {commitment.targetDailyMinutes ? ` · ${commitment.targetDailyMinutes} min/day` : ""}
        </p>
      </div>
      <div className="flex gap-2">
        {commitment.status === "pending" && onAccept && (
          <Button size="sm" onClick={() => onAccept(commitment.id)}>
            Accept
          </Button>
        )}
        {commitment.status === "pending" && onDecline && (
          <Button size="sm" variant="outline" onClick={() => onDecline(commitment.id)}>
            Decline
          </Button>
        )}
        {commitment.status === "active" && onComplete && (
          <Button size="sm" variant="outline" onClick={() => onComplete(commitment.id)}>
            Complete
          </Button>
        )}
      </div>
    </Card>
  );
}
