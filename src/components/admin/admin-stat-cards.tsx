"use client";

import { StatCard } from "@/components/shared/stat-card";

interface AdminStatCardsProps {
  subjectsCount: number;
  selectedCount: number;
}

export function AdminStatCards({ subjectsCount, selectedCount }: AdminStatCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <StatCard label="Subjects" value={subjectsCount} variant="admin" delay={0} />
      <StatCard label="Selected" value={selectedCount} variant="admin" delay={0.05} />
    </div>
  );
}
