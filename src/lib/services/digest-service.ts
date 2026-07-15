import type { CompetencyDataAccess } from "@/lib/db/data-access";
import { PushDeliveryService } from "@/lib/services/push-delivery";
import { logError } from "@/lib/shared/logger";

export interface WeeklyStats {
  totalAttempts: number;
  avgScore: number;
  topSubjects: string;
}

export interface DigestResult {
  sent: number;
  total: number;
}

export interface DigestDeps {
  db: CompetencyDataAccess;
}

export class DigestService {
  private pushService: PushDeliveryService;

  constructor(private readonly deps: DigestDeps) {
    this.pushService = new PushDeliveryService();
  }

  async computeWeeklyStats(): Promise<WeeklyStats> {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    let totalAttempts = 0;
    let avgScore = 0;
    let topSubjects = "";

    try {
      const attempts = await this.deps.db.quizAttempts
        .where("completedAt")
        .aboveOrEqual(sevenDaysAgo)
        .toArray();
      totalAttempts = attempts.length;
      avgScore =
        totalAttempts > 0
          ? Math.round((attempts.reduce((s, a) => s + a.score, 0) / totalAttempts) * 100) / 100
          : 0;

      const subjMap = new Map<string, number[]>();
      for (const a of attempts) {
        const arr = subjMap.get(a.odSubject) ?? [];
        arr.push(a.score);
        subjMap.set(a.odSubject, arr);
      }
      topSubjects = [...subjMap.entries()]
        .map(([subject, scores]) => ({
          subject,
          avg: Math.round((scores.reduce((s, sc) => s + sc, 0) / scores.length) * 100),
        }))
        .toSorted((a, b) => b.avg - a.avg)
        .slice(0, 3)
        .map((s) => `${s.subject} (${s.avg}%)`)
        .join(", ");
    } catch (e) {
      logError("WeeklyDigestStats", e);
    }

    return { totalAttempts, avgScore, topSubjects };
  }

  formatDigestMessage(stats: WeeklyStats): {
    title: string;
    body: string;
  } {
    const title = "Your Weekly Lumni Digest";
    const body = `You completed ${stats.totalAttempts} quiz${stats.totalAttempts === 1 ? "" : "zes"} this week with ${stats.avgScore}% average.${stats.topSubjects ? ` Top subjects: ${stats.topSubjects}.` : ""} Keep it up!`;
    return { title, body };
  }

  async sendPushNotifications(title: string, body: string): Promise<DigestResult> {
    try {
      return await this.pushService.sendToAll({
        title,
        body,
        url: "/dashboard",
      });
    } catch (e) {
      logError("WeeklyDigestPush", e);
      return { sent: 0, total: 0 };
    }
  }
}
