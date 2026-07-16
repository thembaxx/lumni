import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import { logError } from "@/lib/shared/logger";
import { databases } from "@/lib/appwrite.server";
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/db/client";
import { Query } from "node-appwrite";

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
      action: "create" | "resolve" | "note";
      note?: string;
    };

    // Verify teacher has access to this student
    const teacherCheck = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.SCHOOL_MEMBERS,
      [
        Query.equal("schoolId", body.schoolId || ""),
        Query.equal("userId", userId!),
        Query.equal("role", "teacher"),
      ],
    );

    if (teacherCheck.total === 0) {
      throw new Error("Not authorized to create interventions for this student");
    }

    try {
      const intervention = await databases.createDocument(
        APPWRITE_DATABASE_ID,
        "teacher_interventions",
        "unique()",
        {
          studentId,
          teacherId: userId!,
          action,
          note: note || "",
          createdAt: new Date().toISOString(),
          status: action === "resolve" ? "resolved" : "active",
        },
      );

      // Also log to analytics
      // await databases.createDocument(APPWRITE_DATABASE_ID, COLLECTIONS.ANALYTICS, "unique()", {
      //   event: "teacher_intervention",
      //   userId,
      //   metadata: JSON.stringify({ studentId, action, note }),
      //   timestamp: Date.now(),
      // });

      return { success: true, intervention };
    } catch (err) {
      logError("TeacherIntervention.Create", err);
      throw err;
    }
  },
});

export const GET = createRouteHandler({
  auth: "required",
  errorLabel: "TeacherInterventions",
  useRateLimit: true,
  execute: async ({ req, userId }) => {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    const status = searchParams.get("status") || "active";
    const limit = Math.min(Number.parseInt(searchParams.get("limit") || "20", 10), 100);

    const queries = [Query.equal("teacherId", userId!), Query.limit(limit)];
    if (studentId) queries.push(Query.equal("studentId", studentId));
    if (status !== "all") queries.push(Query.equal("status", status));

    const interventions = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      "teacher_interventions",
      queries,
    );

    return { interventions: interventions.documents };
  },
});
