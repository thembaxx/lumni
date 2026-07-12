"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { useNavigationDirection } from "@/hooks/use-navigation-direction";

export function StudyBuddyCard() {
  const [activeCount, setActiveCount] = useState(0);
  const { push } = useNavigationDirection();

  useEffect(() => {
    fetch("/api/study-buddies/commitments")
      .then((r) => r.json())
      .then((data) => {
        const active = (data.commitments ?? []).filter(
          (c: { status: string }) => c.status === "active",
        );
        setActiveCount(active.length);
      })
      .catch(() => {});
  }, []);

  return (
    <Card
      className="cursor-pointer p-4 transition-colors hover:bg-secondary/50"
      onClick={() => push("/study-buddies")}
      role="button"
      tabIndex={0}
      aria-label={`Study buddies: ${activeCount} active commitments`}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Study Buddies</h3>
          <p className="text-sm text-muted-foreground">
            {activeCount > 0
              ? `${activeCount} active commitment${activeCount > 1 ? "s" : ""}`
              : "Find a study buddy"}
          </p>
        </div>
        <span className="text-2xl" aria-hidden="true">
          👥
        </span>
      </div>
    </Card>
  );
}
