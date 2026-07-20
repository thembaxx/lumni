"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useTeacherObservations } from "@/hooks/use-teacher-observations";

interface ObservationTimelineProps {
  studentId: string;
}

export function ObservationTimeline({ studentId }: ObservationTimelineProps) {
  const { observations, loading, addObservation } = useTeacherObservations(studentId);
  const [newNote, setNewNote] = useState("");
  const [saving, setSaving] = useState(false);

  const addObservationHandler = async () => {
    if (!newNote.trim()) return;
    setSaving(true);
    await addObservation(newNote.trim());
    setNewNote("");
    setSaving(false);
  };

  if (loading) return <Skeleton className="h-32 rounded-lg" />;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <Textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Add observation note..."
          className="min-h-14 text-sm"
        />
        <Button
          onClick={addObservationHandler}
          disabled={!newNote.trim() || saving}
          size="sm"
          className="shrink-0"
        >
          {saving ? "Saving…" : "Add Note"}
        </Button>
      </div>
      {observations.length === 0 ? (
        <p className="text-muted-foreground text-xs">No observations yet</p>
      ) : (
        <div className="flex flex-col gap-2">
          {observations.map((obs, i) => (
            <div key={obs.id ?? i} className="flex flex-col gap-1 rounded-lg border p-3">
              <p className="text-sm">{obs.content}</p>
              <p className="text-(--fs-caption-3) text-muted-foreground">
                {new Date(obs.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
