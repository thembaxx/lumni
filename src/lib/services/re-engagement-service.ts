import type { AnalyticsEvent } from "@/lib/db/types";
import type { ObservabilityDataAccess } from "@/lib/db";
import { logError } from "@/lib/shared/logger";

const DAY_MS = 86_400_000;

export interface InactiveSubject {
  subject: string;
  daysSinceLastActive: number;
}

export interface ReEngagementResult {
  notified: boolean;
  message?: string;
  deepLink?: string;
}

export class ReEngagementService {
  constructor(private deps: { db: ObservabilityDataAccess }) {}

  async getInactiveSubjects(userId: string): Promise<InactiveSubject[]> {
    try {
      const cutoff = Date.now() - 30 * DAY_MS;
      const events = await this.deps.db.analyticsEvents
        .where("userId")
        .equals(userId)
        .filter((e) => e.timestamp >= cutoff && e.eventType === "session_start")
        .toArray();

      const subjectActivity = new Map<string, number>();

      for (const event of events) {
        if (event.metadata) {
          try {
            const meta = JSON.parse(event.metadata) as Record<string, unknown>;
            const subject = meta.subject as string;
            if (subject) {
              const existing = subjectActivity.get(subject) ?? 0;
              if (event.timestamp > existing) {
                subjectActivity.set(subject, event.timestamp);
              }
            }
          } catch {
            // skip unparseable metadata
          }
        }
      }

      const now = Date.now();
      const threeDaysAgo = now - 3 * DAY_MS;
      const inactive: InactiveSubject[] = [];

      for (const [subject, lastActive] of subjectActivity) {
        if (lastActive < threeDaysAgo) {
          inactive.push({
            subject,
            daysSinceLastActive: Math.floor((now - lastActive) / DAY_MS),
          });
        }
      }

      return inactive;
    } catch (err) {
      logError("ReEngagementService.getInactiveSubjects", err);
      return [];
    }
  }

  getOptimalSendTime(analyticsEvents: AnalyticsEvent[]): string {
    const hourCounts = Array.from({ length: 24 }, () => 0);

    for (const event of analyticsEvents) {
      if (event.eventType === "session_start") {
        const hour = new Date(event.timestamp).getHours();
        hourCounts[hour]++;
      }
    }

    let maxCount = 0;
    let optimalHour = 9;

    for (let h = 0; h < 24; h++) {
      if (hourCounts[h] > maxCount) {
        maxCount = hourCounts[h];
        optimalHour = h;
      }
    }

    if (optimalHour >= 5 && optimalHour < 12) return "morning";
    if (optimalHour >= 12 && optimalHour < 17) return "afternoon";
    return "evening";
  }

  generateMessage(
    userId: string,
    inactiveSubject: string,
    daysSinceLastActive: number,
    streak: number = 0,
    weakestTopic?: string,
    competencyPercent?: number,
  ): { message: string; deepLink: string; templateKey: string } {
    const hour = new Date().getHours();

    const isMorning = hour >= 6 && hour < 12;
    const isAfternoon = hour >= 12 && hour < 17;
    const isEvening = hour >= 17 && hour < 22;

    if (isMorning && streak > 3) {
      return {
        message: `Your ${inactiveSubject} streak is waiting!`,
        deepLink: `/dashboard?subject=${encodeURIComponent(inactiveSubject)}`,
        templateKey: "morning-streak",
      };
    }

    if (isAfternoon && competencyPercent !== undefined && competencyPercent < 60 && weakestTopic) {
      return {
        message: `Quick quiz: ${weakestTopic} needs practice`,
        deepLink: `/quiz?subject=${encodeURIComponent(inactiveSubject)}&topic=${encodeURIComponent(weakestTopic)}&count=5`,
        templateKey: "afternoon-weakest",
      };
    }

    if (isEvening) {
      return {
        message: "Today's challenge is ready",
        deepLink: "/dashboard",
        templateKey: "evening-challenge",
      };
    }

    if (daysSinceLastActive > 14) {
      return {
        message: "It's been a while! Here's your personalized refresher",
        deepLink: "/quiz?count=3",
        templateKey: "dormant-two-weeks",
      };
    }

    if (daysSinceLastActive > 7) {
      return {
        message: `${inactiveSubject} misses you! Try a 5-question warmup`,
        deepLink: `/quiz?subject=${encodeURIComponent(inactiveSubject)}&count=5`,
        templateKey: "dormant-week",
      };
    }

    return {
      message: `Come back to ${inactiveSubject} and keep learning!`,
      deepLink: `/quiz?subject=${encodeURIComponent(inactiveSubject)}&count=5`,
      templateKey: "generic-reminder",
    };
  }

  async checkAndNotify(userId: string): Promise<ReEngagementResult> {
    try {
      const inactive = await this.getInactiveSubjects(userId);
      if (inactive.length === 0) {
        return { notified: false };
      }

      const inactiveSubject = inactive[0];
      const { message, deepLink } = this.generateMessage(
        userId,
        inactiveSubject.subject,
        inactiveSubject.daysSinceLastActive,
      );

      return {
        notified: true,
        message,
        deepLink,
      };
    } catch (err) {
      logError("ReEngagementService.checkAndNotify", err);
      return { notified: false };
    }
  }
}
