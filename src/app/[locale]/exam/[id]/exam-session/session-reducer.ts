export type SessionPhase =
  | "loading"
  | "mode-select"
  | "active"
  | "submitting"
  | "results"
  | "mock-confirm";

export interface ExamSessionClientProps {
  id: string;
  mode: "timed" | "practice" | "mock";
}
