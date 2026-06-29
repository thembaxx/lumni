"use client";

import * as m from "motion/react-m";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { dexieDataAccess } from "@/lib/db";
import type { FlashcardDataAccess } from "@/lib/db/data-access";

const _deps: { db: FlashcardDataAccess } = { db: dexieDataAccess };

import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { iOSEase } from "@/lib/utils/animation";
import type { StudySet } from "./hooks/use-study-set-storage";
import { ItemPickerDialog } from "./item-picker-dialog";
import { TagChips } from "./tag-chips";

interface StudySetFormProps {
  onSubmit: (data: StudySet) => void;
  onCancel: () => void;
  initialValues?: Partial<StudySet>;
}

export function StudySetForm({ onSubmit, onCancel, initialValues }: StudySetFormProps) {
  const [formData, setFormData] = useState<StudySet>({
    id: "",
    title: "",
    description: "",
    flashcardIds: [],
    noteIds: [],
    tags: [],
    subject: "",
    topic: "",
    createdAt: "",
    updatedAt: "",
    isFavorite: false,
    ...initialValues,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const studySet: StudySet = {
      ...formData,
      id: formData.id || Math.random().toString(36).substr(2, 9),
      createdAt: formData.createdAt || new Date().toISOString(),
      updatedAt: formData.updatedAt || new Date().toISOString(),
    };
    onSubmit(studySet);
  };

  const [showFlashcardPicker, setShowFlashcardPicker] = useState(false);
  const [showNotesPicker, setShowNotesPicker] = useState(false);
  const [availableFlashcards, setAvailableFlashcards] = useState<{ id: string; front: string }[]>(
    [],
  );
  const [availableNotes, setAvailableNotes] = useState<{ id: string; title: string }[]>([]);

  useEffect(() => {
    if (showFlashcardPicker) {
      _deps.db.flashcards.toArray().then((cards) =>
        setAvailableFlashcards(
          cards.map((c) => ({
            id: c.id,
            front: c.front,
          })),
        ),
      );
    }
  }, [showFlashcardPicker]);

  useEffect(() => {
    if (showNotesPicker) {
      (async () => {
        try {
          const { dexieDataAccess } = await import("@/lib/db");
          const notes = await dexieDataAccess.notes.toArray();
          setAvailableNotes(
            notes.map((n) => ({
              id: n.uuid,
              title: n.title,
            })),
          );
        } catch {
          setAvailableNotes([]);
        }
      })();
    }
  }, [showNotesPicker]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === "tags") {
      setFormData((prev) => ({
        ...prev,
        [name]: value.split(",").reduce((acc, tag) => {
          const trimmed = tag.trim();
          if (trimmed.length > 0) acc.push(trimmed);
          return acc;
        }, [] as string[]),
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleFlashcardSelect = (flashcardId: string) => {
    setFormData((prev) => {
      const hasId = prev.flashcardIds.includes(flashcardId);
      return {
        ...prev,
        flashcardIds: hasId
          ? prev.flashcardIds.filter((id) => id !== flashcardId)
          : [...prev.flashcardIds, flashcardId],
      };
    });
  };

  const handleNoteSelect = (noteId: string) => {
    setFormData((prev) => {
      const hasId = prev.noteIds.includes(noteId);
      return {
        ...prev,
        noteIds: hasId ? prev.noteIds.filter((id) => id !== noteId) : [...prev.noteIds, noteId],
      };
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="title">Title</FieldLabel>
          <Input
            id="title"
            name="title"
            value={formData.title || ""}
            onChange={handleInputChange}
            placeholder="Enter study set title"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="description">Description (Optional)</FieldLabel>
          <Textarea
            id="description"
            name="description"
            value={formData.description || ""}
            onChange={handleInputChange}
            placeholder="Describe what this study set covers"
            className="min-h-20"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="flashcards">Flashcards</FieldLabel>
          <div className="flex flex-col gap-2">
            <p className="mb-1 font-medium text-sm">Select flashcards to include:</p>
            <TagChips
              items={availableFlashcards.map((c) => ({
                id: c.id,
                label: c.front,
              }))}
              selectedIds={formData.flashcardIds}
              onRemove={handleFlashcardSelect}
              emptyMessage="No flashcards selected"
              ariaLabel="Remove flashcard"
            />
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setShowFlashcardPicker(true)}
            >
              Add Flashcards
            </Button>
          </div>
        </Field>

        <ItemPickerDialog
          open={showFlashcardPicker}
          onOpenChange={setShowFlashcardPicker}
          title="Select Flashcards"
          items={availableFlashcards.map((c) => ({
            id: c.id,
            label: c.front,
          }))}
          selectedIds={formData.flashcardIds}
          onToggle={handleFlashcardSelect}
          emptyMessage="No flashcards available. Create some first."
        />

        <Field>
          <FieldLabel htmlFor="notes">Notes</FieldLabel>
          <div className="flex flex-col gap-2">
            <p className="mb-1 font-medium text-sm">Select notes to include:</p>
            <TagChips
              items={availableNotes.map((n) => ({
                id: n.id,
                label: n.title,
              }))}
              selectedIds={formData.noteIds}
              onRemove={handleNoteSelect}
              emptyMessage="No notes selected"
              ariaLabel="Remove note"
            />
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setShowNotesPicker(true)}
            >
              Add Notes
            </Button>
          </div>
        </Field>

        <ItemPickerDialog
          open={showNotesPicker}
          onOpenChange={setShowNotesPicker}
          title="Select Notes"
          items={availableNotes.map((n) => ({
            id: n.id,
            label: n.title,
          }))}
          selectedIds={formData.noteIds}
          onToggle={handleNoteSelect}
          emptyMessage="No notes available. Create some first."
        />

        <Field>
          <FieldLabel htmlFor="tags">Tags (Optional)</FieldLabel>
          <Input
            id="tags"
            name="tags"
            value={Array.isArray(formData.tags) ? formData.tags.join(", ") : ""}
            onChange={handleInputChange}
            placeholder="e.g., biology, exam-prep, chapter-5"
          />
          <FieldDescription>Separate tags with commas</FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="subject">Subject (Optional)</FieldLabel>
          <Select
            id="subject"
            name="subject"
            value={formData.subject || ""}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, subject: value || "" }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a subject" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mathematics">Mathematics</SelectItem>
              <SelectItem value="physical-sciences">Physical Sciences</SelectItem>
              <SelectItem value="life-sciences">Life Sciences</SelectItem>
              <SelectItem value="humanities">Humanities</SelectItem>
              <SelectItem value="languages">Languages</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel htmlFor="topic">Topic (Optional)</FieldLabel>
          <Input
            id="topic"
            name="topic"
            value={formData.topic || ""}
            onChange={handleInputChange}
            placeholder="e.g., algebra, photosynthesis, world war II"
          />
        </Field>
      </FieldGroup>

      <div className="flex items-center gap-x-3">
        <label
          htmlFor="favorite"
          className="flex cursor-pointer items-center gap-2 font-medium text-foreground text-xs/relaxed"
        >
          <input
            type="checkbox"
            id="favorite"
            checked={formData.isFavorite ?? false}
            onChange={(e) => setFormData((prev) => ({ ...prev, isFavorite: e.target.checked }))}
            className="size-4 rounded border-zinc-300 text-primary"
          />
          Mark as favorite
        </label>
      </div>

      <div className="flex justify-end gap-x-3">
        <Button variant="outline" size="icon" asChild onClick={onCancel} aria-label="Cancel">
          <m.div whileTap={{ scale: 0.96 }} transition={{ duration: 0.2, ease: iOSEase }}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <title>Cancel</title>
              <path d="M18 6L6 18" />
              <path d="M6 6l12 12" />
            </svg>
          </m.div>
        </Button>

        <Button type="submit" className="btn-primary">
          {initialValues ? "Update Study Set" : "Create Study Set"}
        </Button>
      </div>
    </form>
  );
}
