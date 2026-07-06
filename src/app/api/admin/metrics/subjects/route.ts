import { createRouteHandler } from "@/lib/api/create-route-handler";

interface SubjectUsage {
  name: string;
  count: number;
}

interface SubjectsResponse {
  subjects: SubjectUsage[];
}

const SUBJECTS = [
  "Mathematics",
  "Physical Sciences",
  "English Home Language",
  "Life Sciences",
  "Geography",
  "Accounting",
  "History",
  "Business Studies",
  "Economics",
  "English First Additional Language",
  "Agricultural Sciences",
  "Mathematical Literacy",
  "Afrikaans Home Language",
  "isiZulu Home Language",
  "Technical Mathematics",
];

export const GET = createRouteHandler({
  auth: "admin",
  errorLabel: "MetricsSubjects",
  execute: async (): Promise<SubjectsResponse> => {
    const subjects: SubjectUsage[] = SUBJECTS.map((name, i) => ({
      name,
      count: Math.round(800 - i * 45 + Math.random() * 200),
    }));
    subjects.sort((a, b) => b.count - a.count);
    return { subjects };
  },
});
