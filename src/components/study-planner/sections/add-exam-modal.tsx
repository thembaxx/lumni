"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { ExamDate as ExamDateType } from "@/lib/utils/study-planner";

export function AddExamModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (exam: Omit<ExamDateType, "id" | "daysUntil">) => void;
}) {
  const t = useTranslations();
  const [subject, setSubject] = useState("");
  const [paper, setPaper] = useState("");
  const [date, setDate] = useState("");

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md sm:max-w-md">
        <DialogTitle className="font-medium font-sans text-sm">
          {t("studyPlanner.addExamModalTitle")}
        </DialogTitle>
        <FieldGroup>
          <Field>
            <FieldLabel>{t("studyPlanner.examSubject")}</FieldLabel>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={t("studyPlanner.subjectPlaceholder")}
            />
          </Field>
          <Field>
            <FieldLabel>{t("studyPlanner.examPaper")}</FieldLabel>
            <Input
              value={paper}
              onChange={(e) => setPaper(e.target.value)}
              placeholder={t("studyPlanner.paperPlaceholder")}
            />
          </Field>
          <Field>
            <FieldLabel>{t("studyPlanner.examDate")}</FieldLabel>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              {t("studyPlanner.cancel")}
            </Button>
            <Button
              onClick={() => {
                if (!subject || !paper || !date) return;
                onAdd({
                  subject,
                  paper,
                  date: new Date(date).getTime(),
                });
              }}
              disabled={!subject || !paper || !date}
              className="flex-1"
            >
              Add Exam
            </Button>
          </div>
        </FieldGroup>
      </DialogContent>
    </Dialog>
  );
}
