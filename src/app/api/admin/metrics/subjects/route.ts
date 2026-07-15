import { createRouteHandler } from "@/lib/api/create-route-handler";
import { PlatformAnalyticsService } from "@/lib/analytics/analytics-service";

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
    const analytics = await new PlatformAnalyticsService().fetchAnalytics();
    const subjects: SubjectUsage[] = analytics.subjectPopularity.map((s) => ({
      name: s.subject,
      count: s.sessions,
    }));
    return { subjects };
  },
});
