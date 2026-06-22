import { Query } from "appwrite";
import { databases } from "@/lib/appwrite.server";
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/db/client";

const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const MAX_SIGNIN_ATTEMPTS = 3;
const MAX_MAGICLINK_ATTEMPTS = 1;

interface RateLimitResult {
  allowed: boolean;
  resetAt?: number;
  errorMessage?: string;
}

export class AuthRateLimitService {
  private normalizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }

  private getIp(req: Request): string {
    return (
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip")?.trim() ||
      "unknown"
    );
  }

  private async logAttempt(email: string, action: string, ip: string): Promise<void> {
    await databases.createDocument(APPWRITE_DATABASE_ID, COLLECTIONS.ANALYTICS, "unique()", {
      eventType: "auth_attempt",
      userId: email,
      subjectId: action,
      metadata: JSON.stringify({ ip }),
      timestamp: new Date().toISOString(),
    });
  }

  private async getOldestResetAt(
    email: string,
    action: string,
    sinceTime: string,
  ): Promise<number> {
    const oldestDocs = await databases.listDocuments(APPWRITE_DATABASE_ID, COLLECTIONS.ANALYTICS, [
      Query.equal("eventType", "auth_attempt"),
      Query.equal("userId", email),
      Query.equal("subjectId", action),
      Query.greaterThanEqual("timestamp", sinceTime),
      Query.orderAsc("timestamp"),
      Query.limit(1),
    ]);
    const oldestTime =
      oldestDocs.documents.length > 0
        ? new Date(oldestDocs.documents[0].timestamp).getTime()
        : Date.now();
    return oldestTime + RATE_LIMIT_WINDOW_MS;
  }

  async check(email: string, action: string, req: Request): Promise<RateLimitResult> {
    const normalizedEmail = this.normalizeEmail(email);
    const ip = this.getIp(req);

    if (!APPWRITE_DATABASE_ID || !databases) {
      return { allowed: true };
    }

    const now = Date.now();
    const windowStart = new Date(now - RATE_LIMIT_WINDOW_MS).toISOString();

    if (action === "success") {
      await this.logAttempt(normalizedEmail, "success", ip);
      return { allowed: true };
    }

    if (action === "signin") {
      const successDocs = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.ANALYTICS,
        [
          Query.equal("eventType", "auth_attempt"),
          Query.equal("userId", normalizedEmail),
          Query.equal("subjectId", "success"),
          Query.greaterThanEqual("timestamp", windowStart),
          Query.orderDesc("timestamp"),
          Query.limit(1),
        ],
      );

      const sinceTime =
        successDocs.documents.length > 0 ? successDocs.documents[0].timestamp : windowStart;

      const signinDocs = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.ANALYTICS,
        [
          Query.equal("eventType", "auth_attempt"),
          Query.equal("userId", normalizedEmail),
          Query.equal("subjectId", "signin"),
          Query.greaterThanEqual("timestamp", sinceTime),
          Query.limit(1),
        ],
      );

      if (signinDocs.total >= MAX_SIGNIN_ATTEMPTS) {
        const resetAt = await this.getOldestResetAt(normalizedEmail, "signin", sinceTime);
        const waitMinutes = Math.ceil((resetAt - now) / 60000);
        return {
          allowed: false,
          resetAt,
          errorMessage: `Too many sign-in attempts. Try again in ${waitMinutes} minute${waitMinutes === 1 ? "" : "s"}.`,
        };
      }

      await this.logAttempt(normalizedEmail, "signin", ip);
      return { allowed: true };
    }

    if (action === "magiclink") {
      const magicDocs = await databases.listDocuments(APPWRITE_DATABASE_ID, COLLECTIONS.ANALYTICS, [
        Query.equal("eventType", "auth_attempt"),
        Query.equal("userId", normalizedEmail),
        Query.equal("subjectId", "magiclink"),
        Query.greaterThanEqual("timestamp", windowStart),
        Query.limit(1),
      ]);

      if (magicDocs.total >= MAX_MAGICLINK_ATTEMPTS) {
        const resetAt = await this.getOldestResetAt(normalizedEmail, "magiclink", windowStart);
        const waitMinutes = Math.ceil((resetAt - now) / 60000);
        return {
          allowed: false,
          resetAt,
          errorMessage: `A magic link was already sent. Try again in ${waitMinutes} minute${waitMinutes === 1 ? "" : "s"}.`,
        };
      }

      await this.logAttempt(normalizedEmail, "magiclink", ip);
      return { allowed: true };
    }

    throw new Error("Invalid action");
  }
}
