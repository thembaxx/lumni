import type { SubjectCurriculum } from "@/curriculum/types";

export const QUESTION_TYPES = [
  { value: "", label: "All Types" },
  { value: "multiple-choice", label: "Multiple Choice" },
  { value: "short-answer", label: "Short Answer" },
  { value: "long-answer", label: "Long Answer" },
  { value: "calculation", label: "Calculation" },
  { value: "essay", label: "Essay" },
];

export interface FiltersState {
  selectedSubject: string;
  selectedTopic: string;
  selectedSubtopic: string;
  selectedType: string;
  selectedYear: number | undefined;
  curriculum: SubjectCurriculum | null;
}

export type FiltersAction =
  | { type: "setSubject"; subject: string }
  | { type: "curriculumLoaded"; subject: string; curriculum: SubjectCurriculum }
  | { type: "setTopic"; topic: string }
  | { type: "setSubtopic"; subtopic: string }
  | { type: "setType"; type_: string }
  | { type: "setYear"; year: number | undefined }
  | { type: "clearFilters" };

export function filtersReducer(state: FiltersState, action: FiltersAction): FiltersState {
  switch (action.type) {
    case "setSubject":
      return {
        ...state,
        selectedSubject: action.subject,
        selectedTopic: "",
        selectedSubtopic: "",
        curriculum: null,
      };
    case "curriculumLoaded":
      return {
        ...state,
        curriculum: action.curriculum,
        selectedTopic: "",
        selectedSubtopic: "",
      };
    case "setTopic":
      return { ...state, selectedTopic: action.topic };
    case "setSubtopic":
      return { ...state, selectedSubtopic: action.subtopic };
    case "setType":
      return { ...state, selectedType: action.type_ };
    case "setYear":
      return { ...state, selectedYear: action.year };
    case "clearFilters":
      return {
        ...state,
        selectedTopic: "",
        selectedSubtopic: "",
        selectedType: "",
        selectedYear: undefined,
      };
    default:
      return state;
  }
}

export const INITIAL_FILTERS: FiltersState = {
  selectedSubject: "",
  selectedTopic: "",
  selectedSubtopic: "",
  selectedType: "",
  selectedYear: undefined,
  curriculum: null,
};

export function hasActiveFilters(state: FiltersState): boolean {
  return !!(
    state.selectedTopic ||
    state.selectedSubtopic ||
    state.selectedType ||
    state.selectedYear
  );
}

export function buildYearsRange(): number[] {
  const years: number[] = [];
  for (let i = 2026; i >= 2015; i--) years.push(i);
  return years;
}

export function findCurrentTopic(curriculum: SubjectCurriculum | null, selectedTopic: string) {
  if (!curriculum || !selectedTopic) return null;
  return curriculum.topics.find((t) => t.id === selectedTopic) ?? null;
}
