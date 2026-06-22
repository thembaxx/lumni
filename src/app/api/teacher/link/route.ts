import { createRouteHandler } from "@/lib/api/create-route-handler";
import { linkStudentToTeacher, unlinkStudentFromTeacher } from "@/lib/server/teacher-service";

export const POST = createRouteHandler({
  auth: "required",
  errorLabel: "TeacherLink",
  validate: (body) => {
    if (!body.studentId) return "studentId required";
    return null;
  },
  execute: async ({ userId, body }) => {
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
    const { studentId } = body as { studentId: string };
    await unlinkStudentFromTeacher(userId as string, studentId);
    return { success: true };
  },
});
