import type { Metadata } from "next";
import { PastQuestionBrowser } from "./past-question-browser";

export const instant = false;

export const metadata: Metadata = {
  title: "Question Bank - Lumni",
};

export default function PracticeQuestionsPage() {
  return <PastQuestionBrowser />;
}
