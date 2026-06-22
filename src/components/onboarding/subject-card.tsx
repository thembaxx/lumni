"use client";

import { Card, CardContent } from "@/components/ui/card";

interface Subject {
  id: string;
  name: string;
  color: string;
  category?: string;
}

interface SubjectCardProps {
  subject: Subject;
  selected: boolean;
  onToggle: () => void;
}

export function SubjectCard({ subject, selected, onToggle }: SubjectCardProps) {
  return (
    <Card
      className={`cursor-pointer transition-colors duration-150 hover:ring-2 hover:ring-[--system-accent] active:scale-[0.97] ${
        selected ? "bg-[--system-accent]/5 ring-2 ring-[--system-accent]" : ""
      }`}
      onClick={onToggle}
    >
      <CardContent className="flex items-center gap-3 py-3">
        <div
          className="flex size-9 shrink-0 items-center justify-center rounded-full font-extrabold text-white text-xs"
          style={
            {
              "--subject-color": subject.color,
              backgroundColor: "var(--subject-color)",
            } as React.CSSProperties
          }
        >
          {subject.id.slice(0, 2)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-sm">{subject.name}</p>
          <p className="text-muted-foreground text-xs">Grade 12</p>
        </div>
      </CardContent>
    </Card>
  );
}
