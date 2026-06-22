import { logError } from "@/lib/shared/logger";
import { type ServiceResult, success } from "@/lib/shared/service-result";
import { trackEngineEvent } from "@/lib/utils/engine-analytics";

class AnalyticsService {
  track(
    event: "generate" | "grade" | "hint" | "validate",
    data: {
      subject?: string;
      questionType?: string;
      count?: number;
      success: boolean;
    },
  ): void {
    trackEngineEvent({ event, ...data });
  }

  async getComparativeAnalytics(userId: string): Promise<
    ServiceResult<{
      userPercentile: number;
      subjectRankings: Record<string, number>;
      globalAverage: number;
      userAverage: number;
    }>
  > {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const res = await fetch(`/api/analytics/comparative?userId=${encodeURIComponent(userId)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return success(await res.json());
      } catch (error) {
        logError("AnalyticsService", error);
        if (attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }
    return success({
      userPercentile: 50,
      subjectRankings: {},
      globalAverage: 65,
      userAverage: 0,
    });
  }

  async getSubjectTrend(
    userId: string,
    subject: string,
  ): Promise<
    ServiceResult<{
      dates: string[];
      accuracies: number[];
      trend: "improving" | "declining" | "stable";
    }>
  > {
    try {
      const res = await fetch(
        `/api/analytics/trends?userId=${encodeURIComponent(userId)}&subject=${encodeURIComponent(subject)}`,
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return success(await res.json());
    } catch (error) {
      logError("AnalyticsService", error);
      return success({ dates: [], accuracies: [], trend: "stable" });
    }
  }
}

export const analyticsService = new AnalyticsService();
