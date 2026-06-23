"use client";

import * as m from "motion/react-m";
import { ExamCard } from "@/components/dashboard/practice/exam-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PaperListing } from "@/types/exam";

interface ExamGroupListProps {
  groupedExams: Array<{
    subject: string;
    papers: PaperListing[];
  }>;
  expandedGroups: Set<string>;
  onToggleExpand: (subject: string) => void;
}

export function ExamGroupList({
  groupedExams,
  expandedGroups,
  onToggleExpand,
}: ExamGroupListProps) {
  return (
    <>
      {groupedExams.map((group, groupIndex) => (
        <m.div
          key={group.subject}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: groupIndex * 0.08 }}
          className="flex flex-col gap-2.5"
        >
          <div className="flex items-center justify-between gap-4 px-0.5">
            <h3 className="text-pretty font-semibold text-foreground text-lg">{group.subject}</h3>
            <Badge variant="secondary" className="px-2 py-0 font-medium text-(--fs-caption-3)">
              {group.papers.length}
            </Badge>
          </div>
          <div className="grid gap-2">
            {(expandedGroups.has(group.subject) ? group.papers : group.papers.slice(0, 4)).map(
              (exam) => (
                <ExamCard key={exam.id} exam={exam} />
              ),
            )}
            {group.papers.length > 4 && (
              <Button variant="secondary" size="sm" onClick={() => onToggleExpand(group.subject)}>
                {expandedGroups.has(group.subject)
                  ? "Show less"
                  : `+${group.papers.length - 4} more`}
              </Button>
            )}
          </div>
        </m.div>
      ))}
    </>
  );
}
