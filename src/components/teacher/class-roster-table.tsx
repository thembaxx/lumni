"use client";

import { MasteryBadge } from "@/components/atoms/mastery-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface StudentRow {
  id: string;
  name: string;
  initials: string;
  grade: string;
  overallScore: number;
  weakTopics: string[];
  lastActive: string;
}

interface ClassRosterTableProps extends React.ComponentProps<typeof Table> {
  students: StudentRow[];
  showScores?: boolean;
  onUnlink?: (studentId: string) => void;
  onStudentSelect?: (student: StudentRow) => void;
  unlinkingId?: string;
}

export function ClassRosterTable({
  students,
  showScores = true,
  onUnlink,
  onStudentSelect,
  unlinkingId,
  className,
  ...props
}: ClassRosterTableProps) {
  return (
    <div className={cn("rounded-xl border bg-card", className)}>
      <Table {...props}>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead>Grade</TableHead>
            {showScores && <TableHead>Overall</TableHead>}
            <TableHead>Weak Areas</TableHead>
            <TableHead>Last Active</TableHead>
            {onUnlink && <TableHead />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={showScores ? (onUnlink ? 6 : 5) : onUnlink ? 5 : 4}
                className="py-8 text-center text-muted-foreground text-sm"
              >
                No students in this class yet.
              </TableCell>
            </TableRow>
          )}
          {students.map((student) => (
            <TableRow
              key={student.id}
              className={cn(onStudentSelect && "cursor-pointer hover:bg-muted/50")}
              onClick={() => onStudentSelect?.(student)}
            >
              <TableCell className="font-medium">{student.name}</TableCell>
              <TableCell>{student.grade}</TableCell>
              {showScores && (
                <TableCell>
                  <MasteryBadge
                    level={
                      student.overallScore >= 80
                        ? "mastered"
                        : student.overallScore >= 60
                          ? "proficient"
                          : student.overallScore >= 40
                            ? "developing"
                            : "novice"
                    }
                  />
                </TableCell>
              )}
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {student.weakTopics.slice(0, 3).map((topic) => (
                    <Badge key={topic} variant="secondary" className="text-xs">
                      {topic}
                    </Badge>
                  ))}
                  {student.weakTopics.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{student.weakTopics.length - 3}
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">{student.lastActive}</TableCell>
              {onUnlink && (
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    disabled={unlinkingId === student.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onUnlink(student.id);
                    }}
                  >
                    {unlinkingId === student.id ? "..." : "Unlink"}
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
