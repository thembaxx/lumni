export interface MatricResult {
  name: string;
  examNumber: string;
  school: string;
  province: string;
  subjects: { name: string; percentage: number }[];
  overall: number;
}

export interface MatricResultsResponse {
  results: MatricResult[];
  year: number;
  total: number;
}
