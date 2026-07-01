"use client";

import { useTranslations } from "next-intl";
import { useReducer, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { StudySession as StudySessionType } from "@/lib/utils/study-planner";

type FormState = {
  subject: string;
  topic: string;
  type: "flashcard" | "exam" | "quiz" | "review";
  duration: number;
  repeat: "none" | "daily" | "weekly";
};

type FormAction =
  | { type: "SET_SUBJECT"; payload: string }
  | { type: "SET_TOPIC"; payload: string }
  | { type: "SET_TYPE"; payload: "flashcard" | "exam" | "quiz" | "review" }
  | { type: "SET_DURATION"; payload: number }
  | { type: "SET_REPEAT"; payload: "none" | "daily" | "weekly" };

const initialState: FormState = {
  subject: "",
  topic: "",
  type: "quiz",
  duration: 30,
  repeat: "none",
};

function reducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "SET_SUBJECT":
      return { ...state, subject: action.payload };
    case "SET_TOPIC":
      return { ...state, topic: action.payload };
    case "SET_TYPE":
      return { ...state, type: action.payload };
    case "SET_DURATION":
      return { ...state, duration: action.payload };
    case "SET_REPEAT":
      return { ...state, repeat: action.payload };
    default:
      return state;
  }
}

export function AddSessionModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (session: Omit<StudySessionType, "id">) => void;
}) {
  const t = useTranslations();
  const defaultTime = useRef(Date.now() + 60 * 60 * 1000).current;
  const [form, dispatch] = useReducer(reducer, initialState);
  const { subject, topic, type, duration, repeat } = form;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("studyPlanner.addSessionModalTitle")}</DialogTitle>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel>{t("studyPlanner.sessionSubject")}</FieldLabel>
            <Input
              value={subject}
              onChange={(e) => dispatch({ type: "SET_SUBJECT", payload: e.target.value })}
              placeholder={t("studyPlanner.subjectPlaceholder")}
            />
          </Field>
          <Field>
            <FieldLabel>{t("studyPlanner.sessionTopic")}</FieldLabel>
            <Input
              value={topic}
              onChange={(e) => dispatch({ type: "SET_TOPIC", payload: e.target.value })}
              placeholder={t("studyPlanner.topicPlaceholder")}
            />
          </Field>
          <Field>
            <FieldLabel>{t("studyPlanner.sessionType")}</FieldLabel>
            <Select
              value={type}
              onValueChange={(v) =>
                dispatch({
                  type: "SET_TYPE",
                  payload: v as "flashcard" | "exam" | "quiz" | "review",
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="quiz">{t("studyPlanner.typeQuiz")}</SelectItem>
                <SelectItem value="flashcard">{t("studyPlanner.typeFlashcard")}</SelectItem>
                <SelectItem value="exam">{t("studyPlanner.typeExamPaper")}</SelectItem>
                <SelectItem value="review">{t("studyPlanner.typeReview")}</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>{t("studyPlanner.sessionDuration")}</FieldLabel>
            <Input
              type="number"
              value={duration}
              onChange={(e) =>
                dispatch({
                  type: "SET_DURATION",
                  payload: parseInt(e.target.value, 10) || 30,
                })
              }
              min={5}
              max={120}
            />
          </Field>
          <Field>
            <FieldLabel>{t("studyPlanner.sessionRepeat")}</FieldLabel>
            <Select
              value={repeat}
              onValueChange={(v) =>
                dispatch({
                  type: "SET_REPEAT",
                  payload: v as "none" | "daily" | "weekly",
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("studyPlanner.repeatNone")}</SelectItem>
                <SelectItem value="daily">{t("studyPlanner.repeatDaily")}</SelectItem>
                <SelectItem value="weekly">{t("studyPlanner.repeatWeekly")}</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              {t("studyPlanner.cancel")}
            </Button>
            <Button
              onClick={() =>
                onAdd({
                  subject,
                  topic: topic || undefined,
                  type,
                  scheduledAt: defaultTime,
                  duration,
                  completed: false,
                  repeat,
                })
              }
              disabled={!subject}
              className="flex-1"
            >
              Add Session
            </Button>
          </div>
        </FieldGroup>
      </DialogContent>
    </Dialog>
  );
}
