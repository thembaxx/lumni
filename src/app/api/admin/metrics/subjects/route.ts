import { createRouteHandler } from "@/lib/api/create-route-handler";

interface SubjectUsage {
  name: string;
  count: number;
}

interface SubjectsResponse {
  subjects: SubjectUsage[];
}

export const GET = createRouteHandler({
  auth: "admin",
  errorLabel: "MetricsSubjects",
  execute: async (): Promise<SubjectsResponse> => {
    return { subjects: [] };
  },
});
