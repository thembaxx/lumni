import {
  getSubjectHexColor,
  getSubjectName,
  getSubjectOklchColor,
  getSubjectTailwindColor,
  getSubjectAbbr as getUnifiedAbbr,
} from "@/lib/subjects";

export { getSubjectHexColor, getSubjectName, getSubjectOklchColor, getSubjectTailwindColor };

export function getSubjectColor(subjectId: string): string {
  return getSubjectTailwindColor(subjectId);
}

export function getSubjectAbbr(subjectId: string): string {
  return getUnifiedAbbr(subjectId);
}
