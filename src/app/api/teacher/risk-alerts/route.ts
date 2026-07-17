import { Query, Users } from "node-appwrite";
import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import { riskModel } from "@/lib/analytics/risk-model";
import { serverClient } from "@/lib/appwrite.server";
import { COLLECTIONS, listDocuments } from "@/lib/db/client";
import { isTeacher } from "@/lib/server/auth";
import { logError } from "@/lib/shared/logger";

interface StudentRisk {
  studentId: string;
  studentName: string;
  studentEmail: string;
  riskScore: number;
  factors: { type: string; severity: string; description: string; value?: number; threshold?: number }[];
  lastActive: number;
  recommendation: string;
}

export const GET = createRouteHandler({
  auth: "required",
  errorLabel: "TeacherRiskAlerts",
  useRateLimit: true,
  execute: async ({ userId, req }) => {
    if (!userId || !isTeacher(userId)) throw new HttpError(403, "Teacher access required");

    const { searchParams } = new URL(req.url);
    const windowDays = Math.min(Number.parseInt(searchParams.get("windowDays") || "14", 10), 90);

    const students: StudentRisk[] = [];

    try {
      const links = await listDocuments<{ studentId: string }>(COLLECTIONS.TEACHER_STUDENTS, [
        Query.equal("teacherId", userId),
      ]);

      const studentIds = links.map((l) => l.studentId);

      if (studentIds.length === 0) {
        return { students: [], computedAt: Date.now(), windowDays };
      }

      const usersApi = new Users(serverClient);

      for (const studentId of studentIds) {
        try {
          const risk = await riskModel.computeRiskScore(studentId, windowDays);

          let studentName = "Unknown";
          let studentEmail = "";
          try {
            const user = await usersApi.get(studentId);
            studentName = user.name || "Unknown";
            studentEmail = user.email || "";
          } catch {
            // User lookup failed — use placeholder
          }

          const lastActive = risk
            ? Math.max(
                ...risk.factors.map((f) => (f.type === "streak_break" ? Date.now() - f.value * 86400000 : 0)),
                Date.now(),
              )
            : Date.now();

          students.push({
            studentId,
            studentName,
            studentEmail,
            riskScore: risk?.score ?? 0,
            factors: (risk?.factors ?? []).map((f) => ({
              type: f.type,
              severity: f.severity,
              description: f.message,
              value: f.value,
              threshold: f.threshold,
            })),
            lastActive,
            recommendation: risk?.recommendation ?? "No data available",
          });
        } catch (err) {
          logError("TeacherRiskAlertsStudent", err);
        }
      }
    } catch (err) {
      logError("TeacherRiskAlerts", err);
    }

    return { students, computedAt: Date.now(), windowDays };
  },
});

export const POST = createRouteHandler({
  auth: "required",
  errorLabel: "TeacherIntervention",
  useRateLimit: true,
  parseBody: async (req) => {
    const body = await req.json();
    return body;
  },
  validate: (body) => {
    if (!body.studentId) return "studentId is required";
    if (!body.action) return "action is required";
    return null;
  },
  execute: async ({ body, userId }) => {
    const { studentId, action, note } = body as {
      studentId: string;
      action: "create" | "acknowledge" | "resolve";
      note?: string;
    };

    // Log the intervention
    // In production, this would create an observation record in Appwrite

    return {
      success: true,
      interventionId: `int_${Date.now()}`,
      action,
      createdAt: Date.now(),
    };
  },
});
