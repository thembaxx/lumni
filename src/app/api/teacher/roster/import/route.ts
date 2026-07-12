import { Query, Users } from "node-appwrite";
import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import { isTeacher } from "@/lib/server/auth";
import { serverClient } from "@/lib/appwrite.server";
import { COLLECTIONS, createDocument, listDocuments } from "@/lib/db/client";
import { logError } from "@/lib/shared/logger";
import { meetsTierRequirement } from "@/lib/school/tier-enforcer";
import { getSchool } from "@/lib/school/service";

interface CsvRow {
  studentName: string;
  studentEmail: string;
  grade?: string;
  subject?: string;
}

function parseCsv(text: string): { rows: CsvRow[]; errors: { row: number; message: string }[] } {
  const lines = text.trim().split("\n");
  if (lines.length < 2) {
    return {
      rows: [],
      errors: [{ row: 1, message: "CSV must have a header row and at least one data row" }],
    };
  }

  const header = lines[0]
    .toLowerCase()
    .trim()
    .split(",")
    .map((h) => h.trim());
  const nameIdx = header.indexOf("student_name");
  const emailIdx = header.indexOf("student_email");
  const gradeIdx = header.indexOf("grade");
  const subjectIdx = header.indexOf("subject");

  if (nameIdx === -1 || emailIdx === -1) {
    return {
      rows: [],
      errors: [{ row: 1, message: "CSV must have 'student_name' and 'student_email' columns" }],
    };
  }

  const rows: CsvRow[] = [];
  const errors: { row: number; message: string }[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i]
      .trim()
      .split(",")
      .map((c) => c.trim());
    const email = cols[emailIdx] || "";
    if (!email) {
      errors.push({ row: i + 1, message: "Missing student_email" });
      continue;
    }
    rows.push({
      studentName: cols[nameIdx] || "Unknown",
      studentEmail: email,
      grade: gradeIdx >= 0 ? cols[gradeIdx] : undefined,
      subject: subjectIdx >= 0 ? cols[subjectIdx] : undefined,
    });
  }

  return { rows, errors };
}

export const POST = createRouteHandler({
  auth: "required",
  useRateLimit: true,
  errorLabel: "RosterImport",
  parseBody: async (req) => {
    const text = await req.text();
    return { csvText: text } as Record<string, unknown>;
  },
  validate: (body) => {
    const b = body as { csvText?: string };
    if (!b.csvText || typeof b.csvText !== "string") return "csvText required";
    return null;
  },
  execute: async ({ userId, body }) => {
    if (!userId || !isTeacher(userId)) throw new HttpError(403, "Teacher access required");

    const { schoolId } = body as { schoolId?: string };
    if (schoolId) {
      const school = await getSchool(schoolId);
      if (!school) throw new HttpError(404, "School not found");
      if (!meetsTierRequirement(school.licenseTier, "standard")) {
        throw new HttpError(
          403,
          "Roster import requires at least a Standard plan. Please upgrade.",
        );
      }
    }
    const { csvText } = body as { csvText: string };
    const { rows, errors: parseErrors } = parseCsv(csvText);

    if (parseErrors.length > 0) {
      return { matched: [], unmatched: [], errors: parseErrors };
    }

    if (rows.length > 500) {
      return {
        matched: [],
        unmatched: [],
        errors: [{ row: 0, message: "Maximum 500 rows per import" }],
      };
    }

    const matched: {
      row: number;
      studentId: string;
      name: string;
      email: string;
      grade?: string;
    }[] = [];
    const unmatched: {
      row: number;
      name: string;
      email: string;
      grade?: string;
      subject?: string;
      reason: string;
    }[] = [];

    try {
      const usersApi = new Users(serverClient);

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        try {
          const userList = await usersApi.list({
            queries: [Query.equal("email", row.studentEmail)],
          });

          if (userList.users.length > 0) {
            const appwriteUser = userList.users[0];

            const existingLinks = await listDocuments(COLLECTIONS.TEACHER_STUDENTS, [
              Query.equal("teacherId", userId as string),
              Query.equal("studentId", appwriteUser.$id),
              Query.limit(1),
            ]);

            if (existingLinks.length === 0) {
              await createDocument(COLLECTIONS.TEACHER_STUDENTS, {
                teacherId: userId as string,
                studentId: appwriteUser.$id,
                subjectId: row.subject || null,
              });
            }

            matched.push({
              row: i + 2,
              studentId: appwriteUser.$id,
              name: appwriteUser.name || row.studentName,
              email: row.studentEmail,
              grade: row.grade,
            });
          } else {
            unmatched.push({
              row: i + 2,
              name: row.studentName,
              email: row.studentEmail,
              grade: row.grade,
              subject: row.subject,
              reason: "no_account",
            });
          }
        } catch (err) {
          logError("RosterImportRow", err);
          unmatched.push({
            row: i + 2,
            name: row.studentName,
            email: row.studentEmail,
            grade: row.grade,
            subject: row.subject,
            reason: "lookup_error",
          });
        }
      }
    } catch (err) {
      logError("RosterImport", err);
      return {
        matched: [],
        unmatched: rows.map((r, i) => ({
          row: i + 2,
          name: r.studentName,
          email: r.studentEmail,
          reason: "server_error",
        })),
        errors: parseErrors,
      };
    }

    return { matched, unmatched, errors: parseErrors };
  },
});
