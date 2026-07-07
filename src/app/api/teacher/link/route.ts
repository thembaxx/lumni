import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import { isTeacher } from "@/lib/server/auth";
import { linkStudentToTeacher, unlinkStudentFromTeacher } from "@/lib/server/teacher-service";

function requireTeacherAccess(userId: string | null): void {
  if (!userId || !isTeacher(userId)) {
    throw new HttpError(403, "Teacher access required");
  }
}

export const POST = createRouteHandler({
  auth: "required",
  errorLabel: "TeacherLink",
  validate: (body) => {
    if (!body.studentId) return "studentId required";
    return null;
  },
  execute: async ({ userId, body }) => {
    requireTeacherAccess(userId);
    const { studentId, subjectId } = body as {
      studentId: string;
      subjectId?: string;
    };

    await linkStudentToTeacher(userId as string, studentId, subjectId);
    return { success: true };
  },
});

export const DELETE = createRouteHandler({
  auth: "required",
  errorLabel: "TeacherLink",
  validate: (body) => {
    if (!body.studentId) return "studentId required";
    return null;
  },
  execute: async ({ userId, body }) => {
    requireTeacherAccess(userId);
    const { studentId } = body as { studentId: string };
    await unlinkStudentFromTeacher(userId as string, studentId);
    return { success: true };
  },
});
