import { getSubjectTailwindColor, getSubjectAbbr as getUnifiedAbbr } from "@/lib/subjects";

export function getSubjectColor(subjectId: string): string {
  return getSubjectTailwindColor(subjectId);
}

export function getSubjectAbbr(subjectId: string): string {
  return getUnifiedAbbr(subjectId);
}
