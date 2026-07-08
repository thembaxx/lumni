const ITEMS_PER_PAGE = 50;

export interface QueryConfig {
  subject: string | undefined;
  subtopicId: string | undefined;
  type: string | undefined;
  year: number | undefined;
  limit: number;
  enabled: boolean;
}

export function buildQueryConfig(filters: {
  selectedSubject: string;
  selectedSubtopic: string;
  selectedType: string;
  selectedYear: number | undefined;
}): QueryConfig {
  return {
    subject: filters.selectedSubject || undefined,
    subtopicId: filters.selectedSubtopic || undefined,
    type: filters.selectedType || undefined,
    year: filters.selectedYear,
    limit: ITEMS_PER_PAGE,
    enabled: !!filters.selectedSubject,
  };
}
